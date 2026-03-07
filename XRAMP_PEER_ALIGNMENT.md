# XRamp ↔ Peer (ZKP2P) Protocol Alignment

**Date:** 2026-03-07

This document maps XRamp's current architecture against the Peer (ZKP2P) protocol components, identifies gaps, and defines next steps for full compatibility.

---

## 1. Repository Mapping

| Peer / ZKP2P Repo | Purpose | XRamp Equivalent | Alignment Status |
|---|---|---|---|
| **zkp2p-v1-monorepo** | Full V1 monorepo: circuits, contracts, client | XRamp web app (`/src`) + orchestrator (`/orchestrator`) | Partial — XRamp has similar user flow but different proof and contract architecture |
| **zkp2p-contracts** (V2.1) | Escrow, Orchestrator, UnifiedPaymentVerifier, Registries | `contracts/XRampEscrow.sol` + `orchestrator/src/worker.ts` | **Gap** — XRamp escrow is minimal; no on-chain verifier, no registries |
| **zkp2p-client-sdk** | React Native SDK for mobile proof generation | N/A (XRamp is web + extension only) | Not applicable yet |
| **providers** (`@zkp2p/providers`) | JSON templates for payment platform data extraction | `xramp-extension/src/providers/venmo.ts` imports `@zkp2p/providers/venmo/transfer_venmo.json` | **Aligned** — XRamp uses the official `@zkp2p/providers` package |
| **witness-sdk** (attestor-core) | TLS attestation server (Reclaim protocol): intercepts TLS, generates ZK proofs, signs attestations | Not integrated — XRamp uses direct API fetch, not TLS attestation | **Gap** — XRamp skips the attestor layer entirely |

---

## 2. Component-by-Component Analysis

### 2.1 Escrow Contracts

| Feature | Peer V2.1 (`Escrow.sol`) | XRamp (`XRampEscrow.sol`) | Gap |
|---|---|---|---|
| Deposit creation | `createDeposit()` — maker sets token, amount, payment methods, rates, min/max amounts | `createEscrow(token, amount, payer, payee)` — minimal, no payment method config | **Major** — no payment method configuration, no rate setting |
| Multiple deposits per maker | Yes — maker can create many deposits with different configs | No — each escrow is a single 1:1 relationship | **Major** |
| Payment method registry | `PaymentVerifierRegistry` maps payment methods to verifiers | None — payment method is stored off-chain in D1 intent record | **Major** |
| On-chain verification | `UnifiedPaymentVerifier` validates EIP-712 attestations | None — arbiter calls `release()` based on off-chain admin decision | **Critical gap** |
| Nullifier registry | `NullifierRegistry` prevents double-spending of proofs | None — no on-chain double-spend protection | **Major** |
| Fee system | Protocol fees + referrer fees + maker fees, all on-chain | None on-chain — fee displayed in UI only (0.5% buy, 1% sell) | **Gap** |
| Intent gating | Optional access control signatures | None | Minor |
| Post-intent hooks | `PostIntentHookRegistry` for composability | LFJ swap is off-chain via orchestrator, not an on-chain hook | **Gap** |
| Arbiter model | No single arbiter — trustless via ZK proof verification | Single arbiter wallet controls release/cancel | **Critical gap** |

### 2.2 Orchestrator

| Feature | Peer V2.1 (`Orchestrator.sol`) | XRamp (`orchestrator/src/worker.ts`) | Gap |
|---|---|---|---|
| Deployment | On-chain Solidity contract (Base) | Off-chain Cloudflare Worker + D1 database | **Architectural** — XRamp orchestrator is centralized |
| Intent lifecycle | On-chain state: `signalIntent()` → lock funds → verify → settle | Off-chain state machine: CREATED → FUNDING → FUNDED → PROOF_SUBMITTED → COMPLETE | Parallel concepts, different trust model |
| Verification routing | Routes to `PaymentVerifierRegistry` → `UnifiedPaymentVerifier` | Admin manually clicks "Verify + Release" | **Critical gap** |
| Fund locking | Atomic lock on Escrow contract | Backend arbiter calls `deposit()` or user wallet signs | Partial alignment |
| Settlement | `unlockAndTransfer()` → tokens to recipient | Arbiter calls `release(escrowId)` | Similar outcome, different trust model |

### 2.3 Payment Verification

| Feature | Peer (witness-sdk + UnifiedPaymentVerifier) | XRamp (venmoProofRunner.ts) | Gap |
|---|---|---|---|
| Proof type | **zkTLS attestation** — TLS session notarized by attestor server, EIP-712 signed | **hash(receipt)** — SHA-256 of extracted Venmo API response fields | **Critical gap** — see section 3 |
| Attestor involvement | Reclaim/witness attestor co-signs TLS data, generates ZK proof | None — extension directly fetches Venmo API with session cookies | **Critical gap** |
| On-chain verification | `UnifiedPaymentVerifier.verify(attestationBytes)` validates EIP-712 signature | proofHash stored in D1 database, checked by admin | **Critical gap** |
| Privacy | ZK proof reveals only necessary fields (amount, recipient, timestamp) | SHA-256 hash reveals nothing but also proves nothing cryptographically to a third party | **Gap** — XRamp hash is not independently verifiable |
| Double-spend prevention | `NullifierRegistry` on-chain | None | **Major gap** |
| Multi-provider support | JSON templates via `@zkp2p/providers` for Venmo, PayPal, Wise, Zelle, CashApp, Revolut, etc. | Uses `@zkp2p/providers` for Venmo template, but only Venmo proof runner implemented | Partial — template infra aligned, execution limited to Venmo |

### 2.4 Extension / Client

| Feature | Peer (PeerAuth Extension) | XRamp Extension | Gap |
|---|---|---|---|
| Provider templates | `@zkp2p/providers` JSON — defines URL, selectors, response matching | Same — imports `@zkp2p/providers/venmo/transfer_venmo.json` | **Aligned** |
| Authentication flow | Opens auth link, captures session, intercepts requests | Opens Venmo tab, uses `chrome.scripting.executeScript` with session cookies | Similar approach, different mechanism |
| Proof generation | TLS notarization via witness-sdk → attestor signs → EIP-712 attestation | `sha256(JSON.stringify(proofPayload))` — local hash only | **Critical gap** |
| Proof submission | Submits EIP-712 attestation to on-chain verifier | Submits proofHash to off-chain orchestrator API | **Gap** |
| Transaction matching | Provider template `responseMatches` + `paramSelectors` | Custom `matchTransaction()` in `venmoProofRunner.ts` using stories API | Functionally similar, XRamp implementation is manual |

---

## 3. Proof Flow: hash(receipt) vs. ZK Proof

### What XRamp currently does (Option A: hash(receipt))

```
User pays via Venmo
  ↓
Extension: chrome.scripting.executeScript on Venmo tab
  ↓
Fetches account.venmo.com/api/stories with session cookies
  ↓
matchTransaction(): matches amount, receiver, time window, debit
  ↓
proofPayload = { intentId, amount, date, paymentId, receiverUsername, ... }
  ↓
proofHash = sha256(JSON.stringify(proofPayload))
  ↓
Submit { proofHash, proofPayload } to orchestrator POST /intents/:id/proof
  ↓
Admin manually reviews → clicks "Verify + Release Escrow"
  ↓
Arbiter wallet calls release(escrowId) on Fuji
```

**Trust model:** The proofHash is a commitment to the extracted data, but it is not independently verifiable. Anyone who knows the payload can compute the same hash. The admin must trust that the extension actually fetched this data from Venmo's servers. There is no cryptographic binding between the Venmo TLS session and the proof.

### What Peer does (Option B: zkTLS attestation)

```
User pays via Venmo
  ↓
PeerAuth Extension intercepts HTTPS request matching provider template
  ↓
TLS session is routed through attestor server (witness-sdk)
  ↓
Attestor co-signs the TLS-encrypted data without seeing plaintext
  ↓
ZK proof generated: proves specific fields (amount, recipient, timestamp) 
  without revealing full response
  ↓
Attestor signs EIP-712 typed data attestation
  ↓
Attestation bytes submitted to on-chain UnifiedPaymentVerifier
  ↓
On-chain: verify EIP-712 signature, check nullifier, release funds
  ↓
Fully trustless — no admin needed
```

**Trust model:** The attestor cryptographically co-signs that the data came from Venmo's TLS session. The ZK proof ensures only the relevant fields are revealed. The on-chain verifier checks the attestor's signature — no human review needed.

### Gap Summary

| Aspect | XRamp (Current) | Peer (Target) | Gap Severity |
|---|---|---|---|
| Proof binding to TLS session | None | Attestor co-signs TLS data | **Critical** |
| Independent verifiability | No — hash can be faked | Yes — EIP-712 signature from trusted attestor | **Critical** |
| On-chain verification | None — admin review | `UnifiedPaymentVerifier.verify()` | **Critical** |
| Double-spend prevention | None | `NullifierRegistry` | **Major** |
| Automation | Manual admin release | Fully automated on-chain | **Major** |
| Privacy | All-or-nothing (hash or full payload) | Selective disclosure via ZK | **Medium** |

---

## 4. Escrow Contract: verifyProof(bytes) Compatibility

### Current XRampEscrow.sol

```solidity
function release(uint256 escrowId) external onlyArbiter {
    Escrow storage e = escrows[escrowId];
    require(e.state == State.FUNDED, "Not in FUNDED state");
    e.state = State.RELEASED;
    IERC20(e.token).safeTransfer(e.payee, e.amount);
}
```

The current contract has **no proof verification**. Release is gated only by `onlyArbiter` — a single trusted address.

### Required for Peer Compatibility

```solidity
// Peer-compatible release with on-chain proof verification
function releaseWithProof(
    uint256 escrowId,
    bytes calldata attestationBytes,
    bytes calldata verificationData
) external {
    Escrow storage e = escrows[escrowId];
    require(e.state == State.FUNDED, "Not in FUNDED state");
    
    // Route to payment verifier registry
    bool valid = IPaymentVerifier(verifierRegistry.getVerifier(e.paymentMethod))
        .verify(attestationBytes, verificationData);
    require(valid, "Proof verification failed");
    
    // Check nullifier to prevent double-spend
    bytes32 nullifier = keccak256(attestationBytes);
    require(!nullifierRegistry.isNullified(nullifier), "Already used");
    nullifierRegistry.nullify(nullifier);
    
    e.state = State.RELEASED;
    IERC20(e.token).safeTransfer(e.payee, e.amount);
}
```

### Migration Path

1. **Phase 1 (current):** Keep `onlyArbiter` release for demo. Document as centralized.
2. **Phase 2:** Add `releaseWithProof()` alongside `release()`. Arbiter fallback remains.
3. **Phase 3:** Integrate `UnifiedPaymentVerifier` or deploy a compatible verifier on Avalanche.
4. **Phase 4:** Remove `onlyArbiter` — fully trustless release via proof only.

**Contract changes needed:**
- Add `paymentMethod` field to Escrow struct
- Add `verifierRegistry` address storage
- Add `nullifierRegistry` address storage
- Add `releaseWithProof()` function
- Add `IPaymentVerifier` interface

---

## 5. Extension Integration Assessment

### Current Capabilities (XRamp Extension)

| Capability | Status | Details |
|---|---|---|
| Capture Venmo session | **Working** | `chrome.scripting.executeScript` on Venmo tab, inherits session cookies |
| Extract payment confirmation | **Working** | Fetches `/api/stories`, matches by amount + receiver + time + debit |
| Submit proof to verifier | **Partial** | Submits to off-chain orchestrator, not to on-chain verifier |
| Uses `@zkp2p/providers` templates | **Yes** | Imports `transfer_venmo.json` from official package |
| TLS notarization | **No** | Direct API fetch, no attestor involvement |
| EIP-712 attestation generation | **No** | Produces SHA-256 hash, not EIP-712 typed data |

### Required for Peer Alignment

1. **Integrate witness-sdk** — route Venmo API requests through attestor server
2. **Generate EIP-712 attestations** — use attestor's signature instead of local SHA-256
3. **Submit attestation on-chain** — call `orchestrator.fulfillIntent()` or equivalent
4. **Support multiple providers** — extend beyond Venmo to CashApp, Zelle, Revolut, PayPal

### Migration Path

1. **Phase 1 (current):** Keep `venmoProofRunner.ts` for demo. It works and produces verifiable-enough proof for hackathon.
2. **Phase 2:** Install `@reclaimprotocol/witness-sdk`, configure attestor endpoint.
3. **Phase 3:** Replace direct Venmo API fetch with attestor-routed TLS session.
4. **Phase 4:** Generate EIP-712 attestation instead of SHA-256 hash.
5. **Phase 5:** Submit attestation to on-chain verifier instead of off-chain API.

---

## 6. Multi-LP Provider Architecture

### Peer Protocol (Multi-Maker)

```
Maker A ── createDeposit(1000 USDC, venmo, rate=1.01) ──▶ Escrow
Maker B ── createDeposit(5000 USDC, venmo+zelle, rate=1.00) ──▶ Escrow
Maker C ── createDeposit(2000 USDC, cashapp, rate=1.02) ──▶ Escrow

Taker ── signalIntent(500 USDC, venmo) ──▶ Orchestrator
  Orchestrator selects best deposit (Maker B, rate=1.00)
  Orchestrator locks 500 USDC from Maker B's deposit
  Taker pays via Venmo
  Proof submitted → verified → funds released to Taker
  Maker B receives fiat + remaining deposit unlocked
```

**Key features:**
- Multiple independent liquidity providers (makers)
- Each maker configures their own rates, payment methods, limits
- Takers are matched to best available deposit
- Fully permissionless — anyone can be a maker

### XRamp (Single LP)

```
XRamp Arbiter ── single wallet with AVAX for gas ──▶ XRampEscrow

User ── creates intent via orchestrator ──▶ D1 database
  Orchestrator (backend) calls fundEscrowForIntent()
  Arbiter wallet mints MockUSDC → creates escrow → deposits
  User pays via Venmo
  Extension verifies proof → submits to orchestrator
  Admin clicks "Verify + Release"
  Arbiter wallet calls release()
```

**Current limitations:**
- Single liquidity provider (arbiter wallet)
- No maker marketplace
- No configurable rates per maker
- No permissionless deposit creation
- Arbiter controls all funds

### Migration Path to Multi-LP

| Phase | Change | Effort |
|---|---|---|
| 1. Database support | Add `deposits` table to D1 schema: maker address, token, amount, payment methods, rates | Medium |
| 2. Deposit creation | New endpoint `POST /deposits` — any authenticated user can create a deposit (lock USDC in escrow) | Medium |
| 3. Intent matching | Orchestrator matches taker intent to best available deposit by rate + payment method | Medium |
| 4. Per-deposit escrow | Modify `XRampEscrow.sol` to support multiple deposits with different configs | High |
| 5. Maker management | UI for makers to create/manage/withdraw deposits | High |
| 6. On-chain matching | Move intent matching on-chain (Peer `Orchestrator.sol`) | High |
| 7. Permissionless | Remove arbiter dependency — any maker's deposit can be released via proof | Critical |

---

## 7. Summary: Current State vs. Peer Target

| Dimension | XRamp Now | Peer Target | Gap |
|---|---|---|---|
| **Trust model** | Centralized arbiter | Trustless (ZK proofs) | Critical |
| **Proof type** | SHA-256 hash of receipt | zkTLS attestation + EIP-712 | Critical |
| **On-chain verification** | None | UnifiedPaymentVerifier | Critical |
| **Escrow** | Minimal (create/deposit/release/cancel) | Full (deposits, intents, verification, fees, hooks) | Major |
| **Orchestrator** | Off-chain Cloudflare Worker | On-chain Solidity contract | Major |
| **Liquidity** | Single arbiter wallet | Multi-maker marketplace | Major |
| **Provider templates** | Uses `@zkp2p/providers` | Same | Aligned |
| **Extension** | Captures Venmo, matches tx, submits hash | Captures via TLS attestor, submits EIP-712 | Major |
| **Payment rails** | Venmo (proof), others (manual) | Venmo, PayPal, Wise, Zelle, CashApp, Revolut, Monzo | Medium |
| **Network** | Avalanche Fuji (testnet) | Base (production) | Different chain, same EVM |
| **Token** | MockUSDC (test) | Real USDC | Testnet vs. mainnet |

### What IS aligned today:
- Provider template infrastructure (`@zkp2p/providers`)
- Intent-based architecture concept
- Escrow-based settlement concept
- Extension-based payment verification concept
- Same payment rails (Venmo primary)

### What needs work for full Peer compatibility:
1. **Replace hash(receipt) with zkTLS attestation** (Critical)
2. **Add on-chain proof verification** (Critical)
3. **Remove single arbiter dependency** (Critical)
4. **Upgrade escrow contract to support multi-maker deposits** (Major)
5. **Move orchestrator logic on-chain** (Major)
6. **Add nullifier registry for double-spend prevention** (Major)
7. **Integrate witness-sdk for TLS attestation** (Major)
8. **Extend proof runners beyond Venmo** (Medium)
