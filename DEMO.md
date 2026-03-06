# XRamp — Hackathon Demo Guide (Fuji Testnet)

> **Honest scope**: intent creation + offchain Venmo payment proof + orchestrator state machine + admin escrow release on Avalanche Fuji. AVAX auto-swap and LP deposit funding are NOT wired — they are simulation/future work.

---

## What is REAL vs SIMULATED

| Feature | Status |
|---|---|
| Intent creation (Buy/Sell/Command UI) | ✅ Real — stored in Cloudflare D1 |
| Privy JWT authentication | ✅ Real |
| Venmo payment proof (extension) | ✅ Real — fetches Venmo API, computes sha256 |
| Proof stored in orchestrator DB | ✅ Real |
| Admin verify + release (Activity page) | ✅ Real — transitions state to COMPLETE |
| On-chain escrow `release()` call | ✅ Real **if** `ARBITER_PRIVATE_KEY` is set and intent has `escrowId` |
| MockUSDC balance display (Home/Ramp) | ✅ Real — reads Fuji chain |
| Escrow funding from user wallet | ⚠️ Not wired in UI — `createAndFundEscrow()` exists in `fuji.ts` but no button calls it. For demo, `releaseTxHash` will be null unless escrow is pre-funded manually. |
| AVAX auto-swap (LFJ) | ❌ Simulated only — no LFJ integration |
| LP order book / matching | ❌ Simulated — demo LP pool in CommandMode |
| Rate quotes | ❌ Hardcoded 1:1 ratios |

---

## Infrastructure

| Component | URL / Address |
|---|---|
| Web App (deployed) | https://xramp-app.vercel.app |
| Orchestrator (Cloudflare Worker) | https://xramp-orchestrator.xramp.workers.dev |
| Extension repo | https://github.com/RGDeva/zkp2p-extension-v1 |
| Fuji RPC | https://api.avax-test.network/ext/bc/C/rpc |
| MockUSDC | `0xb2F4Ca689C54bCe4effcf8A12Cb02089C933C5c6` |
| XRampEscrow | `0xe1189d9644Ba8546FB421c02fd28bf64CF74F821` |
| Arbiter | `0xD2Ca31C1238c460F740bF75FaDF6354F95932e8c` |
| Explorer | https://testnet.snowtrace.io |

---

## 1 · Setup

### Web app (local dev)
```bash
cd XRamp
npm install --legacy-peer-deps
npm run dev        # → http://localhost:5173
```

### Extension (Venmo proof enabled)
```bash
cd xramp-extension
npm install --legacy-peer-deps
XRAMP_ENABLE_VENMO_PROOF=true NODE_ENV=production npm run build
# Load build/ unpacked at chrome://extensions
```

### Orchestrator (local dev)
```bash
cd XRamp/orchestrator
npm install
# Create .dev.vars with PRIVY_APP_SECRET=... and ARBITER_PRIVATE_KEY=...
npx wrangler dev   # → http://localhost:8787
```

---

## 2 · State Machine

```
CREATED → FUNDING → FUNDED → ... → COMPLETE
         ↘ CANCELED / EXPIRED / FAILED
```

- **CREATED** — intent created in DB (web app Buy/Sell/Command UI)
- **FUNDING** — user confirmed on Review page (web app transitions state)
- **FUNDED** — escrow deposit confirmed (not yet wired from UI — see note above)
- **COMPLETE** — admin verified proof and called `verifyAndRelease`

The admin `/verify` endpoint bypasses the state machine and sets `COMPLETE` directly from any state. This is intentional for hackathon demo.

---

## 3 · Core Demo Flow (Venmo on-ramp)

### Prerequisites
- Chrome with XRamp extension loaded (built with `XRAMP_ENABLE_VENMO_PROOF=true`)
- Logged in to https://account.venmo.com in a Chrome tab
- Logged in to XRamp web app at https://xramp-app.vercel.app

---

### Step 1 — Create an on-ramp intent

**Option A: Extension side panel**
```
Open extension → Buy Crypto
Amount: $1.00 | Token: USDC | Method: Venmo | Handle: @receiver
→ Continue
→ "Awaiting Payment" screen shows intent ID (e.g. XRAMP-a1b2c3d4)
```

**Option B: Web app Ramp page**
```
https://xramp-app.vercel.app/ramp?tab=Buy
Amount: $1 | Token: USDC | Method: Venmo | Handle: @receiver
→ Continue → Review → Confirm buy
→ Intent transitions CREATED → FUNDING; Activity tab shows it
```

**Option C: Command UI**
```
Click "⚡ Command" button (bottom-right of any web app page)
Type: "Buy $1 USDC with Venmo"
→ "Intent a1b2c3d4… is live and awaiting payment."
→ "Pay $1 via Venmo, then open the XRamp extension → Verify with Venmo (Beta)"
```

All paths call `POST /intents` on the Cloudflare orchestrator.

---

### Step 2 — Send the real Venmo payment

```
Venmo app or account.venmo.com
→ Send $1.00 to @receiver
→ Memo: XRAMP-<shortId>  (shown on extension pending screen)
```

---

### Step 3 — Venmo proof verification (extension)

```
Extension → "Awaiting Payment" screen
→ Click "Verify with Venmo (Beta)"
```

What happens:
1. Extension finds the open `account.venmo.com` tab
2. `chrome.scripting.executeScript` fetches `/api/stories?feedType=me` (uses existing session cookies — **never stored**)
3. Matches transaction: receiver handle + amount + within 30 min window + **debit only** (per zkp2p template `"amount":"- $..."`)
4. Extracts proof fields: `amount`, `date`, `paymentId`, `receiverUsername`, `currency`
5. Computes `proofHash = sha256(JSON.stringify(proofPayload))` — cookies/headers never in payload
6. Calls `POST /intents/:id/proof` → orchestrator stores proof row + updates `intents.proofHash`
7. Sends `chrome.runtime.sendMessage('xramp_proof_to_tab')` → background → content script → `window.postMessage(XRAMP_PROOF_RESULT)`

Extension shows: `✓ Payment confirmed! · Proof Hash: abcd…5678`

---

### Step 4 — Web app receives proof

`AppLayout.tsx` `useProofMessageListener` hook receives `XRAMP_PROOF_RESULT`:

```
→ POST /intents/:id/proof  (stores proof, idempotent)
→ If admin (rishig@umich.edu):
     POST /intents/:id/verify
     → marks proofs.verified = 1
     → if escrowId set: calls escrow.release(escrowId) on Fuji
     → sets state = COMPLETE, releaseTxHash (if escrow existed)
     → toast: "Proof verified — escrow released!"
→ If not admin:
     toast: "Payment proof submitted — Awaiting admin release"
```

---

### Step 5 — Activity confirms state

```
Web app → Activity
→ State badge: COMPLETE (pulsing blue while active)
→ Proof Hash: abcd… · ✓ Verified
→ Release Tx: 0x… ↗ Snowtrace  ← only if escrow was pre-funded
→ Admin sees "Verify + Release Escrow" button (manual fallback)
```

> **Note on `releaseTxHash`**: For a real on-chain tx hash, an escrow must first be created and funded (via `createAndFundEscrow()` in `fuji.ts`). Without that, `releaseTxHash` is null but state still advances to COMPLETE. The proof verification flow is fully real regardless.

---

## 4 · Off-Ramp Demo (Sell)

```
Web app → Ramp → Sell tab
Amount: $5 USDC | Rail: Cash App | $cashtag: $receiver
→ Confirm → Intent OFFRAMP created → state: FUNDING
Admin: Activity → "Verify + Release Escrow"
→ state: COMPLETE
```

Note: There is no automated LP payout wired. The admin release simulates the escrow unlock; actual fiat payout to `$receiver` is manual in the demo.

---

## 5 · Command UI Reference

| Command | What happens |
|---|---|
| `Buy $100 USDC with Venmo` | Creates real ONRAMP intent; guides to extension |
| `Sell $250 USDC to CashApp` | Creates real OFFRAMP intent; guides to Activity |
| `On-ramp $500 and swap to AVAX` | Creates real intent; **swap is simulated** |
| `Express buy $200 USDC` | Creates real intent; express routing is simulated |

On API failure (not logged in / orchestrator down): falls back to full demo simulation — never crashes.

---

## 6 · zkp2p / Peer Alignment

`venmoProofRunner.ts` mirrors `@zkp2p/providers/venmo/transfer_venmo.json`:

| Template field | Implementation |
|---|---|
| `responseMatches: "amount":"- $..."` | `isDebitTransaction()` — outgoing payments only |
| `transactionJsonPathSelectors` | `amount`, `date`, `paymentId`, `receiverUsername`, `currency` |
| `secretHeaders: ["Cookie"]` | Never in `proofPayload` |
| `url` with `{{SENDER_ID}}` | `fetchVenmoStories(tabId)` via scripting |

---

## 7 · Verified Checklist

- [x] `npx tsc --noEmit` exits 0 (web app)
- [x] `XRAMP_ENABLE_VENMO_PROOF=true npm run build` exits 0 (extension)
- [x] Buy → Review → Complete transitions state CREATED → FUNDING
- [x] Sell → Review → Complete transitions state CREATED → FUNDING
- [x] Activity polls every 5s, shows proof hash + verified badge
- [x] AppLayout proof listener: submitProof + admin verifyAndRelease + toast
- [x] CommandMode: real intents for logged-in users; demo simulation fallback
- [x] CommandMode: no fake "✓ complete" messages for real intents
- [x] Home balance reads live MockUSDC balance from Fuji
- [x] Ramp sidebar reads live MockUSDC balance from Fuji
- [x] Venmo proof: debit-only, no cookies in payload, sha256 hash
- [x] Proof relay chain: extension → background → content script → AppLayout ✓
