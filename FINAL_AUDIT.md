# XRamp Final Pre-Demo Audit

**Date:** 2026-03-07
**tsc:** 0 errors
**Orchestrator:** https://xramp-orchestrator.xramp.workers.dev — HEALTHY
**Frontend:** https://xramp-app.vercel.app — auto-deploys from `main`
**Contracts:** deployed on Avalanche Fuji testnet (chainId 43113)
**Arbiter wallet:** `0xD2Ca31C1238c460F740bF75FaDF6354F95932e8c` — ~2.0 AVAX for gas

---

## Architecture Map

### Frontend (React + Vite + Tailwind + shadcn/ui)

| File | Role | Real / Demo |
|---|---|---|
| `src/pages/Home.tsx` | Landing page, delivery address, real MockUSDC balance, recent activity from orchestrator | Real (balance from Fuji RPC) |
| `src/pages/Buy.tsx` | Buy form: amount, payment method, quote calculation | Demo rate (1:1, 0.5% fee) |
| `src/pages/BuyReview.tsx` | Review + confirm: calls `orchestratorApi.fundEscrow()` → backend arbiter funds on Fuji | Real on-chain tx |
| `src/pages/BuyComplete.tsx` | Shows depositTxHash with Snowtrace link, "Fuji testnet · MockUSDC" badge | Real |
| `src/pages/Sell.tsx` | Sell form: amount, payout method, handle input, quote calculation | Demo rate (1:1, 1% fee) |
| `src/pages/SellReview.tsx` | Review + confirm: user wallet signs mint → createEscrow → approve → deposit on Fuji | Real on-chain tx (user wallet) |
| `src/pages/SellComplete.tsx` | Shows depositTxHash with Snowtrace link, "Fuji testnet · MockUSDC" badge | Real |
| `src/pages/Activity.tsx` | Lists intents from orchestrator, detail sheet with all tx hashes, admin verify+release, LFJ swap button | Real |
| `src/pages/Ramp.tsx` | Multi-tab Buy/Sell/Send page (alternate entry point via Home buttons) | Real (same API calls) |
| `src/components/shared/QuotesCard.tsx` | Escrow quote card: "Fuji testnet" badge, "Rate (demo)", "1 USD = 1.00 MockUSDC" | Demo rate |
| `src/components/command/CommandMode.tsx` | Chat/command UI: creates real intents via orchestrator, single XRamp LP, no simulation | Real intent creation; LP stats are cosmetic |
| `src/components/deposit/DepositWidget.tsx` | Landing page deposit widget (triggers Privy login) | UI only |

### Contexts & Providers

| File | Role | Real / Demo |
|---|---|---|
| `src/contexts/AuthContext.tsx` | Privy auth, wallet signer, chain switching to Fuji 43113 | Real |
| `src/contexts/AppContext.tsx` | Global state: selectedCurrency, selectedCrypto, privacyMode | Real |
| `src/providers/PrivyProvider.tsx` | Privy config: appId, Avalanche Fuji default chain, Fuji+Mainnet supported | Real |

### Lib

| File | Role | Real / Demo |
|---|---|---|
| `src/lib/orchestratorApi.ts` | HTTP client for Cloudflare Worker backend, all endpoints typed | Real |
| `src/lib/fuji.ts` | Fuji RPC, MockUSDC/Escrow addresses, balance, escrow creation, mint, explorer URLs | Real on-chain |
| `src/lib/fujiConfig.json` | Deployed contract addresses | Real (matches `contracts/deployed.json`) |

### Orchestrator (Cloudflare Worker + D1)

| File | Role | Real / Demo |
|---|---|---|
| `orchestrator/src/worker.ts` | All endpoints: CRUD intents, fund-escrow, report-funding, proof, verify+release, swap | Real |
| `orchestrator/src/auth.ts` | Privy JWT verification (decode + API verify, fallback to decoded JWT if secret missing) | Real (hackathon fallback noted) |
| `orchestrator/src/state.ts` | Intent state machine: CREATED→FUNDING→FUNDED→PROOF_SUBMITTED→VERIFIED→COMPLETE | Real |
| `orchestrator/src/escrow.ts` | Arbiter wallet: mint MockUSDC → createEscrow → approve → deposit; releaseEscrow; cancelEscrow | Real on-chain |
| `orchestrator/src/lfj.ts` | Arbiter wallet: mint LFJ USDC → approve → swapExactTokensForNATIVE on LBRouter V2.1 | Real on-chain (different USDC token) |
| `orchestrator/schema.sql` | D1 tables: intents, event_log, proofs | Real |
| `orchestrator/wrangler.toml` | Config: PRIVY_APP_ID, ADMIN_EMAILS, FUJI_RPC_URL, contract addresses, D1 binding | Real |

### Contracts (Hardhat, deployed to Fuji)

| File | Address | Verified on Fuji |
|---|---|---|
| `contracts/contracts/MockUSDC.sol` | `0xb2F4Ca689C54bCe4effcf8A12Cb02089C933C5c6` | ✅ bytecode present |
| `contracts/contracts/XRampEscrow.sol` | `0xe1189d9644Ba8546FB421c02fd28bf64CF74F821` | ✅ bytecode present |

### Chrome Extension

| File | Role | Real / Demo |
|---|---|---|
| `xramp-extension/src/lib/venmoProofRunner.ts` | Real Venmo proof: chrome.scripting.executeScript on Venmo tab, session cookies, stories API, tx matching, SHA-256 proofHash | Real |
| `xramp-extension/src/lib/orchestratorClient.ts` | Submits proof to orchestrator `/intents/:id/proof` | Real |
| `xramp-extension/src/providers/venmo.ts` | Venmo provider template (authLink, stories API URL pattern) | Real |

---

## Truth Table

| Step | What happens | Real? | Who signs | Token | Chain |
|---|---|---|---|---|---|
| **Intent creation** | Stored in D1 database, JWT-authenticated | ✅ Real | N/A (API call) | — | — |
| **Escrow funding (Buy)** | Backend arbiter mints MockUSDC, creates escrow, deposits on-chain | ✅ Real Fuji tx | Backend arbiter wallet | MockUSDC (`0xb2F4…`) | Avalanche Fuji |
| **Escrow funding (Sell)** | User's Privy wallet signs: mint → createEscrow → approve → deposit | ✅ Real Fuji tx | User wallet (popup) | MockUSDC (`0xb2F4…`) | Avalanche Fuji |
| **Venmo payment** | User pays via Venmo outside the app | ✅ Real fiat payment | N/A | Fiat USD | — |
| **Proof submission** | Extension fetches Venmo stories API, matches tx, computes SHA-256, submits proofHash | ✅ Real | N/A (extension) | — | — |
| **Admin verify + release** | Arbiter calls `release(escrowId)` on Fuji, MockUSDC released to payee | ✅ Real Fuji tx | Backend arbiter | MockUSDC (`0xb2F4…`) | Avalanche Fuji |
| **LFJ swap** | Arbiter mints LFJ testnet USDC, swaps USDC→AVAX via LBRouter V2.1 | ✅ Real Fuji tx | Backend arbiter | LFJ USDC (`0xB607…`) | Avalanche Fuji |
| **Rate (demo)** | Fixed 1:1 USD = MockUSDC, labeled "(demo)" in UI | ⚠️ Demo rate | — | — | — |
| **Fees (demo)** | 0.5% buy, 1% sell, labeled in UI | ⚠️ Demo rate | — | — | — |
| **MockUSDC** | Open-mint test ERC-20, 6 decimals, anyone can mint | ⚠️ Testnet only | — | — | — |
| **Single LP** | All liquidity from XRamp backend arbiter wallet | ⚠️ Not a marketplace | — | — | — |

---

## Current Limitations

1. **Rate is hardcoded 1:1** — no real price oracle or market rate. Labeled "(demo)" in all UI.
2. **MockUSDC is not real USDC** — open-mint test token. On mainnet this would be real USDC.
3. **Single LP** — XRamp backend arbiter wallet is the only liquidity provider. No multi-LP marketplace.
4. **LFJ uses different USDC** — LFJ testnet USDC (`0xB607…`) ≠ escrow MockUSDC (`0xb2F4…`). On mainnet these would be the same.
5. **Admin verify is manual** — admin clicks "Verify + Release Escrow" button. Not automated.
6. **Auth fallback** — if Privy token verify fails (e.g., secret not configured), backend falls back to trusting decoded JWT. Noted in code.
7. **Extension requires Venmo login** — user must be logged into Venmo in Chrome for proof to work.
8. **Sell flow mints MockUSDC to user** — user doesn't need to actually hold USDC; the flow auto-mints. This is testnet behavior.
9. **Command/chat UI** — creates real intents but LP stats bar (reliability %, fill rate) is cosmetic display only.
10. **Ramp.tsx duplicate** — alternate Buy/Sell/Send entry point exists at `/ramp`. Uses same API calls but has its own rate calculation with TOKEN_PRICES map (includes AVAX at $28.50, etc.). This page is NOT the primary demo flow.

---

## What Is Live vs. Simulated

### LIVE (on-chain, verifiable)
- All escrow transactions (create, deposit, release, cancel)
- All tx hashes displayed with Snowtrace links
- Intent lifecycle in D1 database
- Venmo proof verification via extension
- LFJ DEX swap

### DEMO-LABELED (works but clearly marked)
- Rate: "Rate (demo)" — 1:1 fixed
- Fees: hardcoded percentages
- Token: MockUSDC (test token)
- Network: "Fuji testnet" badge everywhere
- LP: "XRamp LP · single provider"

### NOT SIMULATED (removed)
- No `alert()` calls anywhere
- No fake multi-LP pool/routing
- No simulation fallback in CommandMode
- No "receive AVAX" copy in core flow
- No hidden demo mode toggles
