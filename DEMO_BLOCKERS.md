# XRamp Demo Blockers

**Date:** 2026-03-07
**Status:** Ready to test

---

## Summary

No demo-critical blockers found. All core flows are functional with real on-chain transactions. Minor issues are cosmetic or post-demo.

---

## Blockers

### DEMO-CRITICAL (must work for live demo)

| # | Issue | Severity | Status | Owner | Notes |
|---|---|---|---|---|---|
| — | None found | — | — | — | All critical paths verified |

### HIGH (should fix before demo if time allows)

| # | Issue | Severity | Status | Owner | Notes |
|---|---|---|---|---|---|
| H1 | **Arbiter wallet gas balance** — if arbiter runs out of AVAX, Buy escrow funding and admin release will fail silently (500 from orchestrator) | High | ✅ OK now (~2.0 AVAX) | Rishi | Check balance before demo: `curl -s -X POST https://api.avax-test.network/ext/bc/C/rpc -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xD2Ca31C1238c460F740bF75FaDF6354F95932e8c","latest"],"id":1}'` — refill from faucet.avax.network if < 0.5 AVAX |
| H2 | **Extension must be logged into Venmo** — proof flow requires active Venmo session in Chrome. If session expired, proof returns "Could not fetch Venmo transactions" | High | By design | Rishi | Log into Venmo in Chrome before demo |
| H3 | **Sell flow requires user wallet AVAX for gas** — if embedded wallet has 0 AVAX, sell confirm will fail with gas error message (correctly handled, shows faucet link) | High | Handled in UI | User | Fund embedded wallet from faucet.avax.network before sell demo |

### MEDIUM (cosmetic or non-blocking)

| # | Issue | Severity | Status | Owner | Notes |
|---|---|---|---|---|---|
| M1 | **Ramp.tsx has TOKEN_PRICES map with AVAX at $28.50** — this alternate page calculates receive amounts using market prices, but the primary Buy/Sell pages use 1:1 demo rate. Inconsistency if user navigates via Home → "Buy" button (goes to `/ramp?tab=Buy`). | Medium | Known | — | Primary demo path uses `/buy` not `/ramp`. Home buttons navigate to `/ramp` which has its own rate logic. Not visible in main demo script. |
| M2 | **BuyReview/SellReview fallback defaults** — if user navigates directly to `/buy/review` without state, hardcoded defaults show (payAmount: '100.00'). Not a real issue during demo. | Medium | By design | — | Normal React Router state behavior |
| M3 | **CommandMode LP stats are cosmetic** — reliability 99%, fill rate 100%, avg time ~2 min are display-only values, not computed from real data | Medium | Cosmetic | — | LP stats bar is visual only; intent creation is real |
| M4 | **Auth fallback in orchestrator** — if PRIVY_APP_SECRET is missing or Privy verify fails, backend falls back to trusting decoded JWT without cryptographic verification | Medium | Hackathon tradeoff | — | Secret is configured in Cloudflare Workers secrets |
| M5 | **QuotesCard shows `displayToken` from selectedCrypto** — if user selects a token other than USDC (e.g., AVAX from TokenSelectorModal), the quote still calculates 1:1 against MockUSDC but displays the selected token name. Could be confusing. | Medium | Edge case | — | Demo should keep USDC selected |
| M6 | **LFJ swap pool liquidity** — LFJ testnet USDC-AVAX pool may have limited liquidity. Large swap amounts (>$100) may fail or return very little AVAX | Medium | Testnet limitation | — | Use small amounts ($1-$5) for LFJ demo |

### LOW (post-demo)

| # | Issue | Severity | Status | Owner | Notes |
|---|---|---|---|---|---|
| L1 | **No automated proof verification** — admin must manually click "Verify + Release Escrow" | Low | By design | — | Future: webhook-triggered auto-verify |
| L2 | **Extension Buy/Sell/Send pages are UI shells** — extension has Buy/Sell pages but they don't connect to orchestrator intent creation (only proof flow works) | Low | Known | — | Extension's primary demo value is proof submission |
| L3 | **Privacy mode** — "Hides amounts on screen only" tooltip is honest; amounts are not encrypted | Low | Cosmetic | — | Privacy mode is a UI convenience feature |
| L4 | **Supabase env vars still in .env** — legacy from Lovable scaffold, not used by current code | Low | Dead config | — | No functional impact |

---

## Pre-Demo Checklist

- [ ] Orchestrator healthy: `GET /health` returns `{"ok":true}`
- [ ] Arbiter wallet has ≥ 0.5 AVAX for gas
- [ ] Logged into Venmo in Chrome (for proof flow)
- [ ] Extension loaded in Chrome (unpacked from `xramp-extension/build/`)
- [ ] XRamp web app loads at https://xramp-app.vercel.app
- [ ] Log in with rishig@umich.edu (admin account for verify+release)
- [ ] Fund embedded wallet with testnet AVAX from faucet (for sell flow)
- [ ] Test one buy flow end-to-end before live demo
- [ ] Verify Snowtrace links open correctly

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Fuji RPC down | Low | Critical | Use backup RPC: `https://rpc.ankr.com/avalanche_fuji` |
| Arbiter out of gas | Low | Critical | Check balance before demo, fund from faucet |
| Venmo session expired | Medium | High | Log into Venmo fresh before demo |
| LFJ pool empty | Medium | Low | Use small amounts; LFJ swap is optional demo |
| Privy login slow | Low | Medium | Pre-login before demo; stay logged in |
| Cloudflare Worker cold start | Low | Low | Hit /health first to warm up |
