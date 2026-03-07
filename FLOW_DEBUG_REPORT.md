# XRamp Flow Debug Report

**Date:** 2026-03-07 | **Session:** Pre-demo final debug pass

---

## Phase 1 — Quote Source of Truth

### Root Cause Found
The quote inconsistency was in **`Ramp.tsx`** (the primary `/ramp` page with Buy/Sell/Send tabs), not in the standalone `Buy.tsx`.

**`Ramp.tsx` was computing:**
```ts
const buyPrice = TOKEN_PRICES[buyToken.symbol] ?? 1;  // AVAX: 28.5
const buyReceive = buyNum > 0 ? (buyNum / buyPrice).toFixed(6) : '';
// $1 → 1/28.5 = 0.035 AVAX
```

**`QuotesCard.tsx` was computing (correctly):**
```ts
const netOut = num - (num * PROTOCOL_FEE); // 1:1 minus 0.5%
// $1 → 0.995 MockUSDC
```

This produced two conflicting numbers on the same screen.

### Fix Applied
**`src/pages/Ramp.tsx`** — removed `TOKEN_PRICES` constant entirely, replaced both buy and sell receive calculations:

```ts
// BUY (was: buyNum / buyPrice)
const buyReceive = buyNum > 0 ? (buyNum - buyNum * 0.005).toFixed(2) : '';

// SELL (was: sellNum * sellPrice * 0.99)
const sellReceive = sellNum > 0 ? (sellNum * (1 - 0.01)).toFixed(2) : '';
```

Rate label changed from `1 AVAX ≈ $28.5` → `Demo rate: 1 USD = 1 MockUSDC`.

### Quote Formula: Single Source of Truth (ALL screens)

| Screen | Formula | Result ($100 input) |
|---|---|---|
| `Ramp.tsx` Buy tab | `amount * (1 - 0.005)` | 99.50 MockUSDC |
| `Buy.tsx` | `amount * (1 - 0.005)` | 99.50 MockUSDC |
| `QuotesCard.tsx` | `amount * (1 - 0.005)` | 99.50 MockUSDC |
| `BuyReview.tsx` | reads `receiveAmount` from nav state | 99.50 MockUSDC |
| `BuyComplete.tsx` | reads `receiveAmount` from nav state | 99.50 MockUSDC |
| `Activity.tsx` | shows `intent.amount` (raw input) | $100 USD (source asset) |

**Extension `XRampBuy/index.tsx`** also fixed from market rate to demo math:
```ts
// Was: num / TOKEN_PRICES[symbol]  → 0.035 AVAX
// Now: num - num * 0.005           → 99.50 MockUSDC
```

---

## Phase 2 — Buy Flow

### Is it working as designed? **YES**

The buy (onramp) flow is LP-funded — the arbiter wallet (backend) mints MockUSDC, creates the escrow, and deposits on behalf of the user. No wallet popup is required from the user.

### Complete Buy Flow (verified wired end-to-end):

```
1. User → Ramp.tsx / Buy.tsx
   Enter amount + select payment method + handle → Continue

2. Buy.tsx → POST /intents (orchestratorApi.createOnrampIntent)
   Creates intent in D1, state = CREATED
   Navigate → /buy/review with state: { payAmount, receiveAmount, paymentMethod, paymentHandle, currency, crypto, intentId }

3. BuyReview.tsx → PATCH /intents/:id/state { toState: FUNDING }
   Then → POST /intents/:id/fund-escrow { payee: deliveryAddress }
   Orchestrator arbiter: mint MockUSDC → createEscrow → approve → deposit
   Intent state → FUNDED, depositTxHash set
   Navigate → /buy/complete

4. BuyComplete.tsx
   Shows: intent ID, depositTxHash (Fuji explorer link), escrowId
   Status: "Awaiting fiat payment + proof"
   User must: pay LP via Venmo, then use extension to verify

5. Extension (XRampBuy) → verifyVenmoPayment()
   Fetches Venmo stories API with session cookies
   Matches transaction → sha256(proofPayload) → proofHash
   POST /intents/:id/proof { proofHash, payload }
   Intent state → PROOF_SUBMITTED

6. Admin (Activity.tsx) → "Verify + Release Escrow" button
   POST /intents/:id/verify
   Orchestrator: marks proof verified, calls releaseEscrow(escrowId)
   Intent state → COMPLETE
```

### Hidden Breakpoints in Buy Flow

| Step | Status | Risk |
|---|---|---|
| 1→2 Intent creation | ✅ Wired | Needs network to orchestrator |
| 2→3 LP fund escrow | ✅ Wired | Arbiter wallet needs Fuji AVAX for gas |
| 3→4 Navigate to complete | ✅ Wired | `depositTxHash` must be returned by worker |
| 4→5 Extension proof | ✅ Wired (now enabled) | User must be logged into Venmo in browser |
| 5→6 Admin verify | ✅ Wired | Admin must be `rishig@umich.edu` |
| 6 Release on-chain | ✅ Wired | Arbiter must have Fuji AVAX for gas |

**UI is clear**: "XRamp LP funds escrow" + "No wallet transaction required" displayed in BuyReview.

---

## Phase 3 — Sell Flow

### Bug Found and Fixed: Step Ordering + 4 Wallet Popups

**The Bug:**
```ts
// BEFORE (broken ordering):
setConfirmStep('transitioning');
await transitionIntent(intentId, 'FUNDING');

setConfirmStep('signing');       // ← popup label shown BEFORE signer is acquired
const signer = await getWalletSigner();

setConfirmStep('minting');
await mintTestUsdc(signer, ...);  // popup #1

setConfirmStep('signing');       // ← DUPLICATE: same label for 3 more popups
await createAndFundEscrow(signer, ...);  // popups #2, #3, #4 — no differentiation
```

User saw: "Approve wallet transaction…" for popup 1, then immediately "Approve wallet transaction…" for popups 2/3/4. No guidance which step they were on.

**The Fix (`SellReview.tsx`):**
```ts
// AFTER (correct ordering):
setConfirmStep('transitioning');
await transitionIntent(intentId, 'FUNDING');

const signer = await getWalletSigner();  // no popup, just resolves wallet
const signerAddress = await signer.getAddress();
const amount = ethers.parseUnits(sellAmount, 6);
const payee = deliveryAddress || signerAddress;

setConfirmStep('minting');                    // popup 1/4
await mintTestUsdc(signer, signerAddress, amount);

setConfirmStep('creating_escrow');            // popup 2/4
const result = await createAndFundEscrow(signer, ..., (step) => {
  if (step === 'creating')  setConfirmStep('creating_escrow');
  if (step === 'approving') setConfirmStep('approving');
  if (step === 'depositing') setConfirmStep('depositing');
});

setConfirmStep('reporting');
await reportFunding(intentId, { escrowId, depositTxHash, payer, payee });
```

**`fuji.ts` `createAndFundEscrow`** updated to accept optional `onProgress` callback with steps `'creating' | 'approving' | 'depositing'`.

**Step labels now shown:**
1. `Wallet popup 1/4 — Minting test MockUSDC…`
2. `Wallet popup 2/4 — Creating escrow…`
3. `Wallet popup 3/4 — Approving MockUSDC spend…`
4. `Wallet popup 4/4 — Depositing into escrow…`
5. `Recording on-chain…`

**Wallet notice** updated to: *"Your wallet will show 4 popups — mint MockUSDC, create escrow, approve spend, deposit."*

### Complete Sell Flow (verified wired):

```
1. User → Sell.tsx / Ramp.tsx Sell tab
   Enter sell amount + payout method + handle → Continue

2. POST /intents { type: OFFRAMP, ... } → state = CREATED
   Navigate → /sell/review

3. SellReview.tsx:
   a. PATCH /intents/:id/state → FUNDING
   b. getWalletSigner() (switch to Fuji, no popup)
   c. mint MockUSDC → popup 1
   d. createEscrow → popup 2
   e. approve → popup 3
   f. deposit → popup 4
   g. POST /intents/:id/report-funding → state = FUNDED

4. Navigate → /sell/complete (shows depositTxHash)

5. LP pays user via fiat rail

6. Extension submits proof → PROOF_SUBMITTED

7. Admin → Verify + Release → COMPLETE
```

---

## Phase 4 — Wallet / Network

### Architecture: Privy Embedded Wallet (primary), External fallback

```ts
// AuthContext.tsx getWalletSigner():
const embedded = wallets.find(w => w.walletClientType === 'privy');
const external = wallets.find(w => w.walletClientType !== 'privy');
const wallet = embedded || external;
// → switchChain(43113) → BrowserProvider → getSigner()
```

**Config (`PrivyProvider.tsx`):**
- `defaultChain: avalancheFuji`
- `supportedChains: [avalancheFuji, avalanche]`
- `embeddedWallets.ethereum.createOnLogin: 'users-without-wallets'`

**Result:** Email users get an embedded wallet on Fuji automatically. Core wallet users connect externally and it falls back correctly.

**No signer mismatch**: both paths go through `wallet.getEthereumProvider()` → `ethers.BrowserProvider` → `getSigner()`. Chain switching happens before every signing operation.

**Gas**: No automatic gas top-up. If AVAX balance is zero on Fuji, the transaction will fail with an "insufficient funds" error that is caught and displayed: *"Insufficient Fuji AVAX for gas. Get testnet AVAX from faucet.avax.network"*.

---

## Phase 5 — Extension / Proof Readiness

### VENMO_PROOF_ENABLED was OFF — now fixed

**Root cause:** `featureFlags.ts` defaulted to `false` unless `XRAMP_ENABLE_VENMO_PROOF=true` was set at build time. The "Verify with Venmo (Beta)" button never appeared.

**Fix:** Changed to opt-out model — defaults `true`, set `XRAMP_ENABLE_VENMO_PROOF=false` to disable.

```ts
// Before: export const VENMO_PROOF_ENABLED = process.env.XRAMP_ENABLE_VENMO_PROOF === 'true';
// After:  export const VENMO_PROOF_ENABLED = process.env.XRAMP_ENABLE_VENMO_PROOF !== 'false';
```

### Current Proof Pipeline

```
Extension (XRampBuy/index.tsx)
  ↓ handleVerifyVenmo()
  ↓ verifyVenmoPayment({ intentId, amount, receiverUsernameOrId })
      ↓ getVenmoTabId() — finds or opens account.venmo.com
      ↓ fetchVenmoStories(tabId) — executeScript with session cookies
      ↓ matchTransaction(stories, receiver, amount, 30min window)
      ↓ sha256(JSON.stringify(proofPayload)) → proofHash
  ↓ orchestratorClient.submitProof(intentId, { proofHash, payload })
      → POST https://xramp-orchestrator.xramp.workers.dev/intents/:id/proof
      → intent state → PROOF_SUBMITTED
  ↓ chrome.runtime.sendMessage({ action: 'xramp_proof_to_tab', data: result })
```

### Proof Readiness Checklist

| Check | Status |
|---|---|
| `VENMO_PROOF_ENABLED` defaults `true` | ✅ Fixed |
| Extension targets prod orchestrator (`xramp-orchestrator.xramp.workers.dev`) | ✅ |
| Proof submitted with correct `intentId` | ✅ (set from `handleSubmit` → `setIntentId(intent.id)`) |
| Proof submission is non-fatal if backend fails | ✅ (try/catch wraps it) |
| Proof format matches orchestrator `/proof` endpoint | ✅ (`{ proofHash, providerId, payload }`) |
| `matchTransaction` uses 30-min window + debit-only | ✅ |
| Auth token passed to proof submission | ✅ (`getAccessToken()`) |

### Blockers Before Live Venmo Test

1. **Extension must be rebuilt** after `featureFlags.ts` change: `npm run build` in `/Users/rishig/XRamp/xramp-extension`
2. **User must be logged into Venmo** in the same Chrome browser before clicking "Verify with Venmo"
3. **Intent must be in `FUNDED` state** — LP must have funded escrow before user can submit proof
4. **Handle must match** — the `receiverUsernameOrId` in the extension must exactly match the Venmo handle the user paid

---

## Summary: What Was Broken, What Was Fixed

| Issue | File | Status |
|---|---|---|
| Market price quote (`$1 → 0.035 AVAX`) in Ramp.tsx | `src/pages/Ramp.tsx` | ✅ Fixed |
| Market price quote in extension XRampBuy | `xramp-extension/src/pages/XRampBuy/index.tsx` | ✅ Fixed |
| Sell step ordering: `signing` shown before `minting` | `src/pages/SellReview.tsx` | ✅ Fixed |
| Sell: no per-tx step labels across 4 wallet popups | `src/pages/SellReview.tsx`, `src/lib/fuji.ts` | ✅ Fixed |
| `VENMO_PROOF_ENABLED` defaulting to `false` | `xramp-extension/src/lib/featureFlags.ts` | ✅ Fixed |
| Confusing wallet notice (didn't mention 4 popups) | `src/pages/SellReview.tsx` | ✅ Fixed |

## Can I Run a Real Live Venmo Buy Test?

**Yes, with these preconditions met:**
1. Arbiter wallet has Fuji AVAX for gas
2. Extension is **rebuilt** (`npm run build` in xramp-extension) and **reloaded** in Chrome
3. User is logged into Venmo in Chrome
4. User pays correct amount to LP's Venmo handle within 30 minutes
5. Admin (`rishig@umich.edu`) clicks "Verify + Release Escrow" in Activity

## Can I Run a Real Live Sell Test?

**Yes, with these preconditions met:**
1. User's wallet has Fuji AVAX for gas (4 transactions)
2. User's wallet is connected (Privy embedded or Core external)
3. Expect **4 wallet popups** in order — now clearly labeled in UI
4. After escrow is locked, LP pays the user via fiat, admin verifies

## What Still Remains Risky

| Risk | Severity | Notes |
|---|---|---|
| Arbiter gas on Fuji | High | If arbiter AVAX runs out, buy flow fails at fund-escrow step |
| User AVAX gas for sell | High | 4 transactions × gas — need ~0.05 AVAX on Fuji |
| Venmo session cookies | Medium | User must be actively logged in to Venmo |
| 30-minute proof window | Medium | Proof must be submitted within 30 min of payment |
| Proof `receiver` mismatch | Medium | Handle in extension must match exact Venmo username of LP |
| Admin must be online | Low | Release still requires manual admin action |
