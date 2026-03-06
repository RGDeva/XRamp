# XRamp — End-to-End Demo on Avalanche Fuji

> Full flow: fiat on-ramp via Venmo → payment proof via Chrome extension → escrow release on Fuji testnet.

---

## Infrastructure

| Component | URL / Address |
|---|---|
| Web App | https://xramp-app.vercel.app |
| Orchestrator | https://xramp-orchestrator.xramp.workers.dev |
| Extension repo | https://github.com/RGDeva/zkp2p-extension-v1 |
| Fuji RPC | https://api.avax-test.network/ext/bc/C/rpc |
| MockUSDC | `0xb2F4Ca689C54bCe4effcf8A12Cb02089C933C5c6` |
| XRampEscrow | `0xe1189d9644Ba8546FB421c02fd28bf64CF74F821` |
| Explorer | https://testnet.snowtrace.io |

---

## 1 · Setup

### Web app (local dev)
```bash
cd XRamp
npm install --legacy-peer-deps
npm run dev        # → http://localhost:5173
```

### Orchestrator (local dev)
```bash
cd XRamp/orchestrator
npm install
npx wrangler dev   # → http://localhost:8787
# Validates Privy JWTs via PRIVY_APP_SECRET in .dev.vars
```

### Extension (Venmo proof ON)
```bash
cd xramp-extension
npm install --legacy-peer-deps
XRAMP_ENABLE_VENMO_PROOF=true NODE_ENV=production npm run build
# Load build/ unpacked at chrome://extensions
```

---

## 2 · State Machine

```
CREATED → FUNDING → FUNDED → SWAPPING → READY_TO_WITHDRAW → WITHDRAWING → COMPLETE
                                                                         ↘ FAILED / CANCELED / EXPIRED
```

Aligned with peer-onramp flow:
1. **CREATED** — intent registered in orchestrator DB
2. **FUNDING** — user approves + escrow.deposit() on Fuji
3. **FUNDED** — deposit tx confirmed; escrow holds USDC
4. **SWAPPING** — admin verifies Venmo proof, calls escrow.release()
5. **COMPLETE** — releaseTxHash recorded, USDC sent to payee

---

## 3 · Full On-Ramp Demo (Venmo proof)

### Prerequisites
- Chrome with XRamp extension loaded (Venmo proof build)
- Logged in to https://account.venmo.com in a Chrome tab
- Logged in to XRamp web app as `rishig@umich.edu` (admin) for escrow release

---

### Step 1 — Create intent (two ways)

**Via extension (recommended)**
```
Open extension side panel → Buy Crypto
Amount: $1.00
Token: USDC
Payment method: Venmo
Venmo username: xramp_receiver  (or the test receiver handle)
→ Continue
→ Intent created: "Awaiting Payment" screen shows intent ID
```

**Via Command UI (web app)**
```
Click "⚡ Command" button (bottom-right of any web app page)
Type: "Buy $1 USDC with Venmo"
→ Intent created on-chain: <id>… [CREATED]
→ Shows: "Open the XRamp extension → Verify with Venmo (Beta)..."
```

Both paths call `POST /intents` on the orchestrator.

---

### Step 2 — Send the Venmo payment

```
Venmo app / account.venmo.com
Send $1.00 to @xramp_receiver
Memo: XRAMP-<first 8 chars of intent ID shown in extension>
```

> **Note**: The memo is displayed in the extension's "Awaiting Payment" screen as `XRAMP-<shortId>`.

---

### Step 3 — Venmo proof verification (extension)

```
Extension → Buy Crypto → "Awaiting Payment" screen
Click: "Verify with Venmo (Beta)"
```

What happens under the hood:
1. Extension finds (or opens) the `account.venmo.com` tab
2. `chrome.scripting.executeScript` fetches `/api/stories?feedType=me` with session cookies
3. Matches transaction: receiver = `xramp_receiver`, amount = `$1.00`, within 30 min, **debit only** (matches zkp2p template `responseMatches` regex `"amount":"- $..."`)
4. Builds `proofPayload` from `transactionJsonPathSelectors`: amount, date, paymentId, receiverUsername, receiverId, currency
5. `secretHeaders: ["Cookie"]` are never included in the payload
6. Computes `proofHash = sha256(JSON.stringify(proofPayload))`
7. `POST /intents/:id/proof` → orchestrator stores proof + updates `intents.proofHash`
8. `chrome.runtime.sendMessage('xramp_proof_to_tab')` → background → content script → `window.postMessage({ type: 'XRAMP_PROOF_RESULT', payload: { intentId, proofHash, verified: true, ... } })`

Extension shows:
```
✓ Payment confirmed!
Proof Hash: abcd1234ef56…78901234
Submitted to orchestrator · Intent a1b2c3d4
[View in XRamp App ↗]
```

---

### Step 4 — Web app receives proof

The `useProofMessageListener` hook in `AppLayout.tsx` picks up the `XRAMP_PROOF_RESULT` message:

```
→ POST /intents/:id/proof  (idempotent — stores/updates the proof)
→ If verified=true AND user is admin (rishig@umich.edu):
     POST /intents/:id/verify  → escrow.release() on Fuji → state = COMPLETE
     toast: "Proof verified — escrow released!"
→ Else:
     toast: "Payment proof submitted — Awaiting admin release"
```

---

### Step 5 — Activity tab confirms completion

```
Web app → Activity tab
Select the intent
→ Proof Hash: abcd1234… ✓ Verified
→ Proof Status: ✅ Verified  (or "Pending admin review" for non-admin)
→ Release Tx: 0x1a2b3c…  ↗ (Snowtrace link)
→ State badge: COMPLETE
```

Non-admin users see "Verify + Release Escrow" button hidden; admin sees it and can trigger manually.

---

## 4 · Off-Ramp Demo (Sell)

```
Web app → Sell tab
Amount: $5 USDC
Rail: Cash App
CashTag: $receiver
→ Confirm → Intent OFFRAMP created
→ Escrow funded from user wallet
→ LP sends $5 via Cash App to $receiver
→ Admin: Activity → Verify + Release Escrow
→ USDC released to LP
```

---

## 5 · Command UI

| Command | Action |
|---|---|
| `Buy $100 USDC with Venmo` | Creates ONRAMP intent, shows Venmo extension prompt |
| `Sell $250 USDC to CashApp` | Creates OFFRAMP intent |
| `On-ramp $500 and swap to AVAX` | ONRAMP + simulated LFJ swap |
| `Express buy $200 USDC` | Express routing (LP_A, +0.5% fee) |

On API failure, falls back to simulation automatically — never crashes.

---

## 6 · zkp2p Provider Alignment

Our `venmoProofRunner.ts` mirrors the `@zkp2p/providers/venmo/transfer_venmo.json` template:

| Template field | Our implementation |
|---|---|
| `actionType: "transfer_venmo"` | `base.actionType = venmoTemplate.actionType` |
| `authLink` | Used to open/find Venmo tab |
| `url` with `{{SENDER_ID}}` | `fetchVenmoStories(tabId, senderId?)` |
| `$.stories` list selector | `raw.stories` array |
| `transactionJsonPathSelectors` | `amount`, `date`, `paymentId`, `title.receiver.username/id`, `currency` |
| `responseMatches: "amount":"- $..."` | `isDebitTransaction()` — only matches outgoing payments |
| `secretHeaders: ["Cookie"]` | Never included in `proofPayload` |
| `responseRedactions` | Only selected fields in `proofPayload`, no raw response |

---

## 7 · Regression Checklist

- [x] `npx tsc --noEmit` exits 0 on web app (zero errors)
- [x] `XRAMP_ENABLE_VENMO_PROOF=true npm run build` exits 0 on extension (only size warnings)
- [x] Buy flow: `createOnrampIntent` → escrow → `depositTxHash` in Activity
- [x] Sell flow: `createOfframpIntent` → escrow → `releaseTxHash` in Activity  
- [x] Activity: `proofHash` + verified badge rendered; `getIntent` fetches proofs
- [x] CommandMode: opens, minimizes, quick commands, real API + graceful fallback
- [x] Venmo proof: debit-only filter, secretHeaders excluded, sha256 hash
- [x] AppLayout proof listener: `submitProof` + admin `verifyAndRelease` + toast
- [x] No new pages/routes/tabs added; feature flag gates only the Verify button
