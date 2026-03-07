# XRamp Manual Test Plan

**Date:** 2026-03-07
**Environment:** https://xramp-app.vercel.app (or localhost:5173)
**Orchestrator:** https://xramp-orchestrator.xramp.workers.dev
**Admin account:** rishig@umich.edu
**Explorer:** https://testnet.snowtrace.io

---

## Prerequisites

- [ ] Chrome browser with XRamp extension installed (load `xramp-extension/build/` as unpacked)
- [ ] Logged into Venmo in Chrome (for proof flow)
- [ ] Orchestrator is healthy: `curl https://xramp-orchestrator.xramp.workers.dev/health`
- [ ] Arbiter wallet has AVAX for gas (currently ~2.0 AVAX — sufficient)

---

## Test Order

Run tests in this exact order. Each test builds on the previous.

---

### 1. Wallet & Network Verification

| # | Step | Expected | Pass? |
|---|---|---|---|
| 1.1 | Open https://xramp-app.vercel.app | Landing page loads with "Buy crypto / Sell crypto" hero | |
| 1.2 | Click "Get Started" | Privy login modal opens (dark theme, cyan accent) | |
| 1.3 | Log in with email (rishig@umich.edu) | Redirects to logged-in Home page with delivery address | |
| 1.4 | Verify delivery address shown | Embedded wallet address displayed (0x…) | |
| 1.5 | Check MockUSDC balance | Balance shown (may be $0.00 if no prior activity) | |
| 1.6 | Open browser console → check for "unsupported network" errors | No errors — Privy configured with Fuji as defaultChain | |

---

### 2. Buy Flow (Onramp)

| # | Step | Expected | Pass? |
|---|---|---|---|
| 2.1 | Click "Buy" button on Home | Buy page loads | |
| 2.2 | Enter amount: `1` | "You receive" updates to `1.00` (after 0.5% fee = `1.00`) | |
| 2.3 | Verify QuotesCard appears | Shows "Escrow Quote", "Fuji testnet" badge, "Rate (demo)", "1 USD = 1.00 MockUSDC" | |
| 2.4 | Select payment method: Venmo | Venmo icon + name shown, limit displayed | |
| 2.5 | Expand "Quote details" | Shows "Rate (demo)", "XRamp fee" ($0.01), "Settlement: Avalanche Fuji · MockUSDC" | |
| 2.6 | Click "Continue" | Loading dots appear, "Creating intent…" text | |
| 2.7 | Review page loads | Shows "Review buy", pay/receive amounts, "XRamp LP funds escrow" notice, "Settlement: Avalanche Fuji · MockUSDC" | |
| 2.8 | Click "Confirm buy" | Loading: "Confirming intent…" then "XRamp LP funding escrow on Fuji…" | |
| 2.9 | Complete page loads | Title: "Escrow funded by XRamp LP", badge: "Avalanche Fuji testnet · MockUSDC" | |
| 2.10 | Verify depositTxHash | "Escrow Deposit (Fuji)" with clickable Snowtrace link | |
| 2.11 | Click Snowtrace link | Opens testnet.snowtrace.io/tx/0x… — real transaction | |
| 2.12 | Verify Escrow ID shown | Numeric escrow ID displayed | |
| 2.13 | Verify status | "Awaiting fiat payment + proof" | |

**Capture:** Screenshot of BuyComplete page with depositTxHash visible.

---

### 3. Proof Flow (Extension)

| # | Step | Expected | Pass? |
|---|---|---|---|
| 3.1 | Actually pay $1 via Venmo to the expected recipient | Real Venmo payment sent | |
| 3.2 | Open XRamp extension side panel | Extension loads with XRamp branding | |
| 3.3 | Find the intent in extension | Intent listed with amount and state | |
| 3.4 | Click "Verify with Venmo (Beta)" | Extension opens/finds Venmo tab, fetches stories API | |
| 3.5 | Proof matches | Shows verified checkmark, proofHash computed | |
| 3.6 | Proof submitted to orchestrator | proofHash appears on intent, state → PROOF_SUBMITTED | |

**Note:** If Venmo payment was not actually made, proof will fail with "No matching Venmo payment found." This is correct behavior.

**Capture:** Screenshot of extension showing verified proof.

---

### 4. Activity Verification

| # | Step | Expected | Pass? |
|---|---|---|---|
| 4.1 | Click "View activity" on Complete page | Activity page loads | |
| 4.2 | Find the buy intent in list | Shows "Buy · 1 USD → USDC", state badge (FUNDED or PROOF_SUBMITTED) | |
| 4.3 | Click intent → detail sheet opens | Sheet shows all fields | |
| 4.4 | Verify Intent ID | Truncated UUID shown | |
| 4.5 | Verify State badge | Correct state with color coding | |
| 4.6 | Verify "Escrow Deposit (Fuji)" | depositTxHash with Snowtrace link | |
| 4.7 | Verify "Escrow Status" | "Funded" badge with shield icon | |
| 4.8 | Verify "Funded by" | "XRamp LP" (for buy) | |
| 4.9 | Verify Proof Hash (if submitted) | Hash shown with verified/pending badge | |
| 4.10 | Verify filter tabs work | "All", "Active", "Completed" filter correctly | |
| 4.11 | Verify auto-refresh | New data appears within 5s polling interval | |

**Capture:** Screenshot of Activity detail sheet with tx hashes.

---

### 5. Admin Verify + Release

| # | Step | Expected | Pass? |
|---|---|---|---|
| 5.1 | Logged in as rishig@umich.edu | Admin action section visible in intent detail | |
| 5.2 | Click "Verify + Release Escrow" | Loading: "Verifying & Releasing…" | |
| 5.3 | Release succeeds | State → COMPLETE, releaseTxHash appears | |
| 5.4 | Verify "Escrow Release (Fuji)" | releaseTxHash with Snowtrace link | |
| 5.5 | Click Snowtrace link | Real release transaction visible | |
| 5.6 | State badge updates to "COMPLETE" | Green badge, no more pulse animation | |

**Capture:** Screenshot showing releaseTxHash after verify.

**Possible failure:** If arbiter wallet has insufficient AVAX for gas, release will fail. Check arbiter balance first.

---

### 6. LFJ Swap (Optional Enhanced Demo)

| # | Step | Expected | Pass? |
|---|---|---|---|
| 6.1 | Intent is in COMPLETE state | LFJ swap section appears: "Avalanche DeFi composability" | |
| 6.2 | Read description | "Execute a real USDC → AVAX swap on LFJ (Trader Joe) DEX · Fuji testnet. Uses LFJ testnet USDC (separate from escrow MockUSDC; on mainnet these are the same token)." | |
| 6.3 | Click "Swap USDC → AVAX on LFJ (testnet)" | Loading: "Swapping on LFJ…" | |
| 6.4 | Swap succeeds | swapTxHash appears under "LFJ Swap Tx (Fuji)" with Snowtrace link | |
| 6.5 | Swap badge | "USDC → AVAX (testnet)" | |
| 6.6 | DEX label | "LFJ (Trader Joe) V2.1" | |
| 6.7 | Click Snowtrace link | Real swap transaction visible with token transfers | |

**Capture:** Screenshot showing swapTxHash in activity detail.

**Possible failure:** LFJ pool on Fuji may have insufficient liquidity for large amounts. Use small amounts ($1-$5) for demo.

---

### 7. Sell Flow (Offramp)

| # | Step | Expected | Pass? |
|---|---|---|---|
| 7.1 | Navigate to Sell page | Sell form loads | |
| 7.2 | Enter amount: `1` | "You receive" updates (after 1% fee) | |
| 7.3 | Select payout: Venmo, enter handle `@testuser` | Handle input appears with @ prefix | |
| 7.4 | Click "Continue" | Creates OFFRAMP intent, navigates to SellReview | |
| 7.5 | Review page shows | "Review sell", "Your wallet will sign to lock 1 MockUSDC into escrow on Avalanche Fuji testnet" | |
| 7.6 | Click "Confirm sell" | Step labels appear: "Confirming intent…" → "Approve wallet transaction…" → "Minting test USDC to your wallet…" → "Approve wallet transaction…" → "Recording escrow on-chain…" | |
| 7.7 | Wallet popup(s) appear | User must approve 3-4 transactions (mint, createEscrow, approve, deposit) | |
| 7.8 | Complete page loads | "Your MockUSDC is locked", depositTxHash with Snowtrace link | |
| 7.9 | Verify badge | "Avalanche Fuji testnet · MockUSDC" | |

**Capture:** Screenshot of SellComplete with depositTxHash.

**Possible failure:** If user's wallet has insufficient AVAX for gas → error message: "Insufficient Fuji AVAX for gas. Get testnet AVAX from the Avalanche Fuji faucet (faucet.avax.network) and try again."

---

### 8. Command/Chat UI

| # | Step | Expected | Pass? |
|---|---|---|---|
| 8.1 | Click terminal icon in bottom-right | Command panel opens | |
| 8.2 | Type "Buy $1 USDC with Venmo" | Intent created via orchestrator, message: "Intent created: {id}… [CREATED]" | |
| 8.3 | Follow-up messages appear | "Next: go to Buy or Sell page → Review → Confirm to fund escrow on Fuji." | |
| 8.4 | LP stats bar | Shows "XRamp LP · single provider" with cosmetic stats | |
| 8.5 | Quick command buttons work | Clicking pre-set commands creates real intents | |
| 8.6 | If orchestrator unreachable | Message: "⚠ Orchestrator unreachable — intent not created" (no fake simulation) | |
| 8.7 | Minimize/close works | Panel minimizes and restores correctly | |

---

### 9. Edge Cases

| # | Step | Expected | Pass? |
|---|---|---|---|
| 9.1 | Enter $0 amount on Buy | "Enter an amount" validation, Continue disabled | |
| 9.2 | Try Buy without payment method | "Select a payment method" validation | |
| 9.3 | Try Sell without handle (non-bank) | "Enter your Venmo username" validation | |
| 9.4 | Try to access Buy/Review without state | Falls back to defaults (payAmount: '100.00') — navigate back | |
| 9.5 | Log out and view Activity | "Log in to see your activity" message with login button | |
| 9.6 | Non-admin user views intent | No "Verify + Release Escrow" button shown | |

---

## Tx Hashes to Capture Per Intent

For each demo intent, capture these Snowtrace links:

1. **Escrow Deposit (Fuji)** — `depositTxHash`
2. **Proof Hash** — from extension verification
3. **Escrow Release (Fuji)** — `releaseTxHash` (after admin verify)
4. **LFJ Swap Tx (Fuji)** — `swapTxHash` (optional enhanced demo)

---

## Success Criteria

- [ ] Buy flow completes end-to-end with real Fuji tx
- [ ] depositTxHash is clickable and shows real tx on Snowtrace
- [ ] Admin verify + release produces releaseTxHash on Snowtrace
- [ ] Activity page shows correct state labels and all tx hashes
- [ ] No fake alerts, no simulation text, no misleading "AVAX" in core flow
- [ ] All labels say "MockUSDC", "Fuji testnet", "Rate (demo)" where appropriate
- [ ] Extension proof flow works when logged into Venmo
- [ ] LFJ swap produces real swapTxHash (optional)
