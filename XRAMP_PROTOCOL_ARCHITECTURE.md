# XRamp Protocol Architecture

**Date:** 2026-03-07

This document describes XRamp's current architecture end-to-end, maps it against the Peer (ZKP2P) protocol architecture, identifies every gap, and defines the concrete next steps for full compatibility.

---

## 1. XRamp Current Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                     │
│                                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐    ┌───────────────┐  │
│  │   XRamp Web App      │    │  XRamp Extension     │    │  Venmo / Fiat │  │
│  │   React + Vite       │    │  Chrome MV3          │    │  Payment App  │  │
│  │   Privy Auth         │    │  Side Panel           │    │               │  │
│  │   Avalanche Fuji     │    │  Proof Runner         │    │               │  │
│  └──────────┬───────────┘    └──────────┬───────────┘    └───────────────┘  │
│             │                           │                                    │
└─────────────┼───────────────────────────┼────────────────────────────────────┘
              │ HTTPS                      │ HTTPS
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND LAYER                                     │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Orchestrator (Cloudflare Worker)                                    │   │
│  │  xramp-orchestrator.xramp.workers.dev                               │   │
│  │                                                                      │   │
│  │  Endpoints:                                                          │   │
│  │  POST /intents          — create onramp/offramp intent               │   │
│  │  GET  /intents          — list user's intents                        │   │
│  │  GET  /intents/:id      — get intent details                         │   │
│  │  PATCH /intents/:id/state — transition intent state                  │   │
│  │  POST /intents/:id/proof  — submit payment proof                     │   │
│  │  POST /intents/:id/fund-escrow — arbiter funds escrow (buy flow)     │   │
│  │  POST /intents/:id/report-funding — report user funding (sell flow)  │   │
│  │  POST /intents/:id/verify-and-release — admin verify + release       │   │
│  │  POST /intents/:id/swap-lfj — LFJ composability demo swap           │   │
│  │  GET  /health           — health check                               │   │
│  │                                                                      │   │
│  │  Auth: Privy JWT verification (decode + API verify)                  │   │
│  │  Admin: ADMIN_EMAILS env var (rishig@umich.edu)                      │   │
│  │  DB: Cloudflare D1 (intents, event_log, proofs tables)               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ ethers.js RPC calls
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BLOCKCHAIN LAYER                                   │
│                          Avalanche Fuji Testnet (43113)                     │
│                                                                             │
│  ┌──────────────────────────┐    ┌──────────────────────────┐               │
│  │  MockUSDC                │    │  XRampEscrow             │               │
│  │  0xb2F4Ca689C54bCe4…    │    │  0xe1189d9644Ba8546…    │               │
│  │                          │    │                          │               │
│  │  ERC-20 (6 decimals)    │    │  createEscrow()          │               │
│  │  mint(to, amount)       │    │  deposit(escrowId)       │               │
│  │  No access control      │    │  release(escrowId)       │               │
│  │                          │    │  cancel(escrowId)        │               │
│  │                          │    │  arbiter: 0xD2Ca31…     │               │
│  └──────────────────────────┘    └──────────────────────────┘               │
│                                                                             │
│  ┌──────────────────────────┐                                               │
│  │  LFJ (Trader Joe) V2.1  │                                               │
│  │  LBRouter on Fuji       │                                               │
│  │  LFJ USDC: 0xB607…     │                                               │
│  │  swapExactTokensFor     │                                               │
│  │  NATIVE (USDC→AVAX)     │                                               │
│  └──────────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Intent State Machine

```
              ┌──────────┐
              │ CREATED  │
              └────┬─────┘
                   │ fund-escrow (buy) or user signs (sell)
              ┌────▼─────┐
              │ FUNDING  │
              └────┬─────┘
                   │ escrow deposit confirmed
              ┌────▼─────┐
              │ FUNDED   │
              └────┬─────┘
                   │ proof submitted
         ┌────────▼──────────┐
         │ PROOF_SUBMITTED   │
         └────────┬──────────┘
                  │ admin verify
           ┌──────▼──────┐
           │  VERIFIED   │
           └──────┬──────┘
                  │ escrow released
           ┌──────▼──────┐
           │  COMPLETE   │
           └─────────────┘

  Side states: FAILED, CANCELED, EXPIRED
  Optional: SWAPPING → swap on LFJ after COMPLETE
```

### Data Flow: Onramp (Buy)

```
1. User → Web App: enters amount, payment method, handle
2. Web App → Orchestrator: POST /intents { type: ONRAMP, amount, rail, paymentHandle }
3. Orchestrator → D1: insert intent (state: CREATED)
4. Web App → Orchestrator: POST /intents/:id/fund-escrow
5. Orchestrator → Fuji: arbiter mints MockUSDC → createEscrow → approve → deposit
6. Orchestrator → D1: update intent (state: FUNDED, depositTxHash)
7. User → Venmo: sends fiat payment to LP's handle
8. User → Extension: clicks "Verify with Venmo"
9. Extension → Venmo tab: fetches stories API, matches transaction
10. Extension: sha256(proofPayload) → proofHash
11. Extension → Orchestrator: POST /intents/:id/proof { proofHash, payload }
12. Orchestrator → D1: insert proof, update intent (state: PROOF_SUBMITTED)
13. Admin → Web App: clicks "Verify + Release Escrow"
14. Web App → Orchestrator: POST /intents/:id/verify-and-release
15. Orchestrator → Fuji: arbiter calls release(escrowId) → MockUSDC to user
16. Orchestrator → D1: update intent (state: COMPLETE, releaseTxHash)
```

### Data Flow: Offramp (Sell)

```
1. User → Web App: enters amount, payout method, handle
2. Web App → Orchestrator: POST /intents { type: OFFRAMP, amount, rail, paymentHandle }
3. Web App → User wallet: mint MockUSDC → createEscrow → approve → deposit (4 tx)
4. Web App → Orchestrator: POST /intents/:id/report-funding { depositTxHash }
5. Orchestrator → D1: update intent (state: FUNDED, depositTxHash)
6. LP pays user via fiat rail
7. Proof submitted (same as buy flow steps 8-12)
8. Admin verifies + releases (same as buy flow steps 13-16)
```

### Key Files

| Layer | File | Role |
|---|---|---|
| **Frontend** | `src/pages/Buy.tsx` | Buy form: amount, method, handle input |
| | `src/pages/BuyReview.tsx` | Review + confirm → calls fund-escrow |
| | `src/pages/BuyComplete.tsx` | Shows depositTxHash, awaits proof |
| | `src/pages/Sell.tsx` | Sell form: amount, payout, handle |
| | `src/pages/SellReview.tsx` | Review + confirm → user wallet signs escrow |
| | `src/pages/SellComplete.tsx` | Shows depositTxHash, awaits proof |
| | `src/pages/Activity.tsx` | Intent list, detail sheet, admin actions, LFJ swap |
| | `src/pages/Home.tsx` | Landing, balance, recent activity |
| | `src/components/command/CommandMode.tsx` | Chat UI, real intent creation |
| **Lib** | `src/lib/orchestratorApi.ts` | HTTP client for all orchestrator endpoints |
| | `src/lib/fuji.ts` | Fuji RPC, contract ABIs, escrow helpers |
| **Auth** | `src/contexts/AuthContext.tsx` | Privy auth, wallet signer, chain switching |
| | `src/providers/PrivyProvider.tsx` | Privy config, Fuji default chain |
| **Backend** | `orchestrator/src/worker.ts` | All API endpoints, intent lifecycle |
| | `orchestrator/src/escrow.ts` | Arbiter: mint, create, fund, release, cancel |
| | `orchestrator/src/lfj.ts` | LFJ swap: mint LFJ USDC, swap to AVAX |
| | `orchestrator/src/auth.ts` | Privy JWT verification, admin check |
| | `orchestrator/src/state.ts` | State machine transitions |
| **Contracts** | `contracts/contracts/MockUSDC.sol` | Mintable test ERC-20 (6 decimals) |
| | `contracts/contracts/XRampEscrow.sol` | Escrow: create, deposit, release, cancel |
| **Extension** | `xramp-extension/src/lib/venmoProofRunner.ts` | Venmo proof: capture, match, hash |
| | `xramp-extension/src/lib/orchestratorClient.ts` | Submit proof to orchestrator |
| | `xramp-extension/src/providers/venmo.ts` | `@zkp2p/providers` template import |
| | `xramp-extension/src/pages/XRampBuy/index.tsx` | Extension buy flow + proof UI |

---

## 2. Peer (ZKP2P) Protocol Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                     │
│                                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐    ┌───────────────┐  │
│  │   zkp2p.xyz Client   │    │  PeerAuth Extension  │    │  Payment App  │  │
│  │   React app          │    │  Chrome extension     │    │  Venmo/Zelle  │  │
│  │   wagmi/viem         │    │  witness-sdk          │    │  PayPal/etc.  │  │
│  │   Base chain         │    │  @zkp2p/providers     │    │               │  │
│  └──────────┬───────────┘    └──────────┬───────────┘    └───────────────┘  │
│             │                           │                                    │
└─────────────┼───────────────────────────┼────────────────────────────────────┘
              │ RPC                        │ TLS via attestor
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ATTESTATION LAYER                                     │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Reclaim Attestor Server (witness-sdk / attestor-core)               │   │
│  │                                                                      │   │
│  │  1. Client routes HTTPS request through attestor                     │   │
│  │  2. Attestor participates in TLS handshake (MPC-TLS)                │   │
│  │  3. Attestor sees encrypted traffic, co-signs session               │   │
│  │  4. Client generates ZK proof of specific fields                    │   │
│  │  5. Attestor signs EIP-712 typed data attestation                   │   │
│  │  6. Returns: { attestationBytes, signature, nullifier }             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└──────────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SMART CONTRACT LAYER                               │
│                          Base (EVM)                                          │
│                                                                             │
│  ┌──────────────────┐  ┌─────────────────────┐  ┌───────────────────────┐  │
│  │  Escrow.sol      │  │  Orchestrator.sol    │  │ UnifiedPayment       │  │
│  │                  │  │                     │  │ Verifier.sol          │  │
│  │  createDeposit() │  │  signalIntent()     │  │                       │  │
│  │  Maker deposits  │  │  lockFunds()        │  │ verify(attestation)   │  │
│  │  with config:    │  │  fulfillIntent()    │  │ → ecrecover EIP-712  │  │
│  │  - token         │  │  cancelIntent()     │  │ → check attestor set │  │
│  │  - amount        │  │                     │  │ → check timestamp    │  │
│  │  - paymentMethods│  │  Fee distribution   │  │ → nullify payment    │  │
│  │  - rates         │  │  Post-intent hooks  │  │                       │  │
│  │  - limits        │  │                     │  │                       │  │
│  └──────────────────┘  └─────────────────────┘  └───────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Registry System                                                       │ │
│  │  PaymentVerifierRegistry — maps payment methods to verifiers           │ │
│  │  EscrowRegistry — whitelists valid escrow implementations              │ │
│  │  NullifierRegistry — tracks used proofs (prevents double-spend)        │ │
│  │  RelayerRegistry — authorizes gasless transaction relayers             │ │
│  │  PostIntentHookRegistry — manages approved post-settlement hooks       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Peer Intent Lifecycle (On-Chain)

```
Maker: createDeposit(token, amount, paymentMethods[], rates[], limits)
  ↓
Taker: signalIntent(escrow, depositId, amount, recipient, paymentMethod)
  ↓
Orchestrator: lockFunds(escrow, depositId, amount) — atomic on-chain
  ↓
Taker: makes fiat payment off-chain
  ↓
PeerAuth Extension: captures payment → attestor → EIP-712 attestation
  ↓
Taker/Relayer: fulfillIntent(intentHash, attestationBytes, verificationData)
  ↓
Orchestrator → PaymentVerifierRegistry → UnifiedPaymentVerifier:
  verify(attestation) → ecrecover → check attestor → check timestamp → nullify
  ↓
Orchestrator: unlockAndTransfer → Escrow releases tokens to recipient
  ↓
Fees: protocol + referrer + maker fees distributed
  ↓
Optional: PostIntentHook executes (composability)
```

---

## 3. Side-by-Side Comparison

| Component | XRamp | Peer | Alignment |
|---|---|---|---|
| **Client Framework** | React + Vite + Tailwind + shadcn | React + wagmi/viem | Different stack, same SPA pattern |
| **Auth** | Privy (email + embedded wallet) | wagmi (external wallet) | Different auth model |
| **Chain** | Avalanche Fuji (testnet) | Base (production) | Different chain, same EVM |
| **Token** | MockUSDC (test, open-mint) | Real USDC | Testnet vs. production |
| **Escrow Contract** | Minimal: create/deposit/release/cancel, single arbiter | Full: multi-maker deposits, payment method config, rates, limits | **Major gap** |
| **Orchestrator** | Off-chain (Cloudflare Worker + D1) | On-chain (Solidity contract) | **Architectural gap** |
| **Verification** | Off-chain admin review | On-chain EIP-712 attestation verification | **Critical gap** |
| **Proof Type** | SHA-256(receipt payload) | zkTLS attestation (EIP-712 signed) | **Critical gap** |
| **Attestor** | None | Reclaim witness-sdk (MPC-TLS) | **Critical gap** |
| **Nullifier** | None | On-chain NullifierRegistry | **Major gap** |
| **Provider Templates** | `@zkp2p/providers` (Venmo only used) | `@zkp2p/providers` (7+ providers) | **Aligned** (infra), partial (coverage) |
| **Extension** | Custom proof runner (direct API fetch) | PeerAuth (attestor-routed TLS) | **Major gap** |
| **Multi-LP** | Single arbiter wallet | Multi-maker marketplace | **Major gap** |
| **Fees** | UI display only (0.5% buy, 1% sell) | On-chain collection + distribution | **Gap** |
| **Post-Settlement** | LFJ swap via off-chain orchestrator | PostIntentHookRegistry on-chain | **Gap** |
| **Relayers** | None | RelayerRegistry for gasless tx | Not applicable yet |

---

## 4. Gaps: Prioritized

### Critical (Trust Model)

| # | Gap | XRamp Current | Peer Target | Impact |
|---|---|---|---|---|
| C1 | **No zkTLS attestation** | SHA-256 hash of API response | Attestor co-signs TLS session, EIP-712 | Proof has no cryptographic binding to payment provider |
| C2 | **No on-chain verification** | Admin manually clicks release | `UnifiedPaymentVerifier.verify()` on-chain | Settlement requires trusted human |
| C3 | **Single arbiter** | One wallet controls all releases | Trustless — proof verification triggers release | Centralization risk |

### Major (Protocol Architecture)

| # | Gap | XRamp Current | Peer Target | Impact |
|---|---|---|---|---|
| M1 | **Off-chain orchestrator** | Cloudflare Worker | On-chain `Orchestrator.sol` | Centralized intent lifecycle |
| M2 | **No nullifier registry** | No double-spend protection | `NullifierRegistry` on-chain | Same proof could theoretically release multiple escrows |
| M3 | **Single LP** | Arbiter wallet is only liquidity source | Multi-maker deposits with config | No marketplace dynamics |
| M4 | **Minimal escrow** | create/deposit/release/cancel only | Multi-deposit, payment methods, rates, limits, hooks | Cannot support multi-LP or configurable terms |
| M5 | **Extension uses direct fetch** | `chrome.scripting.executeScript` → `fetch()` | TLS routed through attestor | No cryptographic proof of data origin |

### Medium (Feature Parity)

| # | Gap | XRamp Current | Peer Target | Impact |
|---|---|---|---|---|
| F1 | **Venmo only** | Only Venmo proof runner implemented | 7+ provider proof runners | Limited payment rail support |
| F2 | **No on-chain fees** | Fee shown in UI, not enforced | Protocol + referrer + maker fees on-chain | No fee enforcement |
| F3 | **No relayer support** | Users pay their own gas | RelayerRegistry for gasless tx | UX friction for gas |
| F4 | **No post-intent hooks** | LFJ swap is off-chain | PostIntentHookRegistry on-chain | Composability is manual |
| F5 | **Different chain** | Avalanche Fuji | Base | Would need deployment on Base for interop |

---

## 5. Next Steps for Full Compatibility

### Immediate (Before Demo)
- **No code changes needed** — current architecture is functional for demo
- **Honest framing** — describe as "inspired by Peer protocol, using same provider templates, progressing toward full zkTLS compatibility"

### Short-Term (1-2 months)

| Step | Description | Effort | Dependencies |
|---|---|---|---|
| 1 | **Integrate witness-sdk** in extension for Venmo TLS attestation | 2 weeks | Attestor endpoint access |
| 2 | **Generate EIP-712 attestations** instead of SHA-256 hashes | 1 week | Step 1 |
| 3 | **Deploy SimpleAttestationVerifier** on Avalanche Fuji | 1 week | Step 2 |
| 4 | **Add `releaseWithProof()`** to XRampEscrow.sol | 1 week | Step 3 |
| 5 | **Deploy NullifierRegistry** on Fuji | 3 days | Step 3 |
| 6 | **Automate release** — remove manual admin step when proof verifies | 1 week | Steps 3-5 |

### Medium-Term (2-4 months)

| Step | Description | Effort | Dependencies |
|---|---|---|---|
| 7 | **Multi-provider support** — CashApp, Zelle, Revolut, PayPal proof runners | 3 weeks | Step 1 |
| 8 | **Multi-maker deposits** — upgrade escrow to support multiple LPs | 3 weeks | None |
| 9 | **On-chain orchestrator** — move intent lifecycle to Solidity | 4 weeks | Step 8 |
| 10 | **Fee system** — on-chain fee collection and distribution | 2 weeks | Step 9 |
| 11 | **Intent matching** — on-chain matching of takers to best deposits | 2 weeks | Steps 8-9 |

### Long-Term (4-6 months)

| Step | Description | Effort | Dependencies |
|---|---|---|---|
| 12 | **Production deployment** — Base or Avalanche mainnet with real USDC | 2 weeks | All above |
| 13 | **Relayer support** — gasless transactions via RelayerRegistry | 2 weeks | Step 12 |
| 14 | **PostIntentHookRegistry** — LFJ swap as on-chain composability hook | 2 weeks | Steps 9, 12 |
| 15 | **Audit** — smart contract security audit | 4-6 weeks | Steps 3-5, 8-9 |
| 16 | **Full Peer interop** — compatible deposits visible on zkp2p.xyz | 4 weeks | All above |

---

## 6. What XRamp Gets Right Today

Despite the gaps, XRamp already implements several Peer-aligned patterns:

1. **Provider template infrastructure** — uses `@zkp2p/providers` for Venmo, same package as Peer
2. **Intent-based architecture** — intents are first-class objects with typed lifecycle states
3. **Escrow-based settlement** — funds are locked in contract before fiat payment
4. **Extension-based proof capture** — Chrome extension captures payment data from provider
5. **Separation of concerns** — frontend / orchestrator / contracts / extension are distinct layers
6. **Payment rail abstraction** — HANDLE_META pattern supports multiple rails with different handle formats
7. **Composability demo** — LFJ swap shows post-settlement DeFi integration concept
8. **Honest framing** — UI labels clearly distinguish testnet, demo rates, MockUSDC

### Design Decisions That Align With Peer Migration

| Decision | Why It Helps |
|---|---|
| Using `@zkp2p/providers` package | Same template format; switching to attestor-routed TLS requires no template changes |
| Separate `venmoProofRunner.ts` | Clean replacement point — swap implementation without changing caller interface |
| Intent state machine in `state.ts` | Maps to Peer orchestrator states; can be migrated to on-chain |
| Escrow contract is simple | Easy to extend with `releaseWithProof()` without breaking existing flow |
| Orchestrator is modular | `worker.ts` routes are clean; each can be migrated to on-chain equivalent incrementally |
| Extension uses `orchestratorClient.ts` | Single integration point; easy to redirect to on-chain submission |
