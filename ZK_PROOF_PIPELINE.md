# XRamp ZK Proof Pipeline

**Date:** 2026-03-07

This document details XRamp's current proof pipeline, the Peer protocol's zkTLS proof pipeline, and the concrete migration path between them.

---

## 1. Current XRamp Proof Pipeline

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  XRamp Extension (Chrome MV3)                                       │
│                                                                     │
│  venmoProofRunner.ts                                                │
│  ┌───────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ getVenmoTabId │───▶│ fetchVenmoStories│───▶│ matchTransaction │  │
│  │ Open/find tab │    │ executeScript    │    │ amount + receiver│  │
│  │ with session  │    │ with cookies     │    │ + time + debit   │  │
│  └───────────────┘    └──────────────────┘    └────────┬─────────┘  │
│                                                        │            │
│                                              ┌─────────▼─────────┐  │
│                                              │ sha256(payload)   │  │
│                                              │ → proofHash       │  │
│                                              └─────────┬─────────┘  │
└────────────────────────────────────────────────────────┼────────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  XRamp Orchestrator (Cloudflare Worker)                             │
│                                                                     │
│  POST /intents/:id/proof                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Store proofHash + payload in D1 proofs table                 │   │
│  │ Transition intent state → PROOF_SUBMITTED                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  POST /intents/:id/verify-and-release  (admin only)                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Admin reviews proof → calls release(escrowId) on Fuji        │   │
│  │ Transition intent state → VERIFIED → COMPLETE                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  XRampEscrow.sol (Avalanche Fuji)                                   │
│                                                                     │
│  release(escrowId)  ← called by arbiter wallet only                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Require: state == FUNDED                                     │   │
│  │ Require: msg.sender == arbiter                               │   │
│  │ Transfer MockUSDC to payee                                   │   │
│  │ State → RELEASED                                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Proof Generation Code

**File:** `xramp-extension/src/lib/venmoProofRunner.ts`

```typescript
// 1. Find or open Venmo tab
const tabId = await getVenmoTabId();

// 2. Execute script in Venmo tab context (inherits session cookies)
const stories = await fetchVenmoStories(tabId);
// calls: chrome.scripting.executeScript → fetch('https://account.venmo.com/api/stories?feedType=me')

// 3. Match transaction by amount + receiver + time window + debit
const matched = matchTransaction(stories, receiverUsernameOrId, expectedAmount);
// Criteria: amount within $0.02, receiver username/ID match, within 30 min, debit tx

// 4. Build proof payload
const proofPayload = {
  intentId, providerId: 'venmo', actionType: 'transfer_venmo',
  amount: matched.amount, date: matched.date, paymentId: matched.paymentId,
  receiverUsername: matched.title?.receiver?.username,
  receiverId: matched.title?.receiver?.id, currency: 'USD',
};

// 5. Hash it
const proofHash = await sha256(JSON.stringify(proofPayload));
// sha256 via Web Crypto API (crypto.subtle.digest)
```

### What This Proves

| Property | Proven? | How |
|---|---|---|
| Payment actually happened on Venmo | **No** — anyone with the API response can compute the same hash | Hash is a commitment, not a proof |
| Data came from Venmo's servers | **No** — no TLS binding | Extension fetches directly, but nothing binds the data to Venmo's TLS certificate |
| Amount is correct | **Partially** — matched against intent amount | Only within the extension's local context |
| No double-spending | **No** | No nullifier registry |
| Privacy preserved | **No** — full payload is sent to orchestrator | SHA-256 hash accompanies the full payload |

### Trust Assumptions

1. **Trust the extension** — must trust that the extension actually ran the proof runner and didn't fabricate data
2. **Trust the admin** — admin reviews and manually releases; no automated verification
3. **Trust the arbiter** — single wallet controls all fund releases
4. **Trust the browser** — Venmo session cookies must be valid

---

## 2. Peer Protocol zkTLS Proof Pipeline

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  PeerAuth Extension                                                  │
│                                                                     │
│  Provider template: @zkp2p/providers/venmo/transfer_venmo.json      │
│  ┌───────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ Authenticate  │───▶│ Intercept HTTPS  │───▶│ Route through    │  │
│  │ (authLink)    │    │ request matching │    │ attestor server  │  │
│  │               │    │ urlRegex+method  │    │ (witness-sdk)    │  │
│  └───────────────┘    └──────────────────┘    └────────┬─────────┘  │
│                                                        │            │
│                                              ┌─────────▼─────────┐  │
│                                              │ Attestor co-signs │  │
│                                              │ TLS session data  │  │
│                                              │ ZK proof of fields│  │
│                                              │ EIP-712 attestation│ │
│                                              └─────────┬─────────┘  │
└────────────────────────────────────────────────────────┼────────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Orchestrator.sol (Base)                                             │
│                                                                     │
│  fulfillIntent(intentHash, attestationBytes, verificationData)       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Route to PaymentVerifierRegistry.getVerifier(paymentMethod)  │   │
│  │ → UnifiedPaymentVerifier.verify(attestationBytes)            │   │
│  │   → Recover EIP-712 signer                                  │   │
│  │   → Verify signer is trusted attestor                       │   │
│  │   → Check timestamp within buffer                           │   │
│  │   → Nullify payment ID in NullifierRegistry                 │   │
│  │ If valid: unlockAndTransfer → Escrow releases to recipient   │   │
│  │ Fees distributed to protocol + referrer                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Escrow.sol (Base)                                                   │
│                                                                     │
│  unlockAndTransfer(depositId, amount, recipient)                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Require: caller == Orchestrator                              │   │
│  │ Unlock maker's deposit                                       │   │
│  │ Transfer USDC to recipient                                   │   │
│  │ Collect maker fee                                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### What This Proves

| Property | Proven? | How |
|---|---|---|
| Payment actually happened | **Yes** — TLS session data is cryptographically co-signed by attestor | Attestor sees encrypted TLS traffic, proves data came from payment provider |
| Data came from Venmo's servers | **Yes** — TLS certificate chain verification by attestor | Attestor verifies the TLS handshake with Venmo's servers |
| Amount is correct | **Yes** — extracted via provider template, included in attestation | ZK proof selectively reveals amount field |
| No double-spending | **Yes** — NullifierRegistry on-chain | Payment ID is nullified, cannot be reused |
| Privacy preserved | **Yes** — ZK proof reveals only required fields | Full response hidden; only amount, recipient, timestamp disclosed |

### Trust Assumptions

1. **Trust the attestor** — must trust that the attestor server honestly co-signs TLS data (minimized: attestor cannot see plaintext due to TLS properties)
2. **Trust the provider template** — must correctly identify the right API endpoint and response fields
3. **No admin needed** — verification is fully automated on-chain

---

## 3. Gap Analysis: XRamp → Peer

### Layer 1: Data Capture (Extension)

| Step | XRamp | Peer | Gap |
|---|---|---|---|
| Session acquisition | Opens Venmo tab, uses cookies | Opens auth link, captures session | Similar |
| API request | `chrome.scripting.executeScript` → `fetch()` | Intercepts matching HTTPS request | Different mechanism, same data |
| Data extraction | Manual `matchTransaction()` logic | Provider template `paramSelectors` + `responseMatches` | XRamp is manual; Peer is template-driven |
| **TLS binding** | **None** | **Attestor co-signs TLS session** | **Critical gap** |

### Layer 2: Proof Generation

| Step | XRamp | Peer | Gap |
|---|---|---|---|
| Input | Raw JSON response fields | TLS-notarized response | **Critical** |
| Processing | `sha256(JSON.stringify(payload))` | ZK proof generation + EIP-712 signing | **Critical** |
| Output | `proofHash: string` | `attestationBytes: bytes` (EIP-712 signed typed data) | **Critical** |
| Verifiability | Only by someone who trusts the extension | By any on-chain contract checking EIP-712 signature | **Critical** |

### Layer 3: Proof Submission

| Step | XRamp | Peer | Gap |
|---|---|---|---|
| Target | Off-chain API: `POST /intents/:id/proof` | On-chain: `orchestrator.fulfillIntent()` | **Major** |
| Data sent | `{ proofHash, proofPayload }` | `{ intentHash, attestationBytes, verificationData }` | Different format |
| Storage | D1 database `proofs` table | On-chain event logs | Different persistence |

### Layer 4: Verification

| Step | XRamp | Peer | Gap |
|---|---|---|---|
| Verifier | Admin human review | `UnifiedPaymentVerifier.verify()` | **Critical** |
| Signature check | None | EIP-712 `ecrecover` → check against trusted attestor set | **Critical** |
| Nullifier | None | `NullifierRegistry.nullify(paymentId)` | **Major** |
| Automation | Manual click | Fully automated | **Major** |

### Layer 5: Settlement

| Step | XRamp | Peer | Gap |
|---|---|---|---|
| Release trigger | Admin calls orchestrator → arbiter calls `release()` | Orchestrator contract calls `unlockAndTransfer()` after verification | **Major** |
| Authorization | `onlyArbiter` modifier | `onlyOrchestrator` modifier (after proof verification) | Different trust model |
| Fees | UI display only | On-chain collection and distribution | **Gap** |

---

## 4. Migration Roadmap

### Phase 1: Current (Demo-Ready)
**Status: Complete**

- SHA-256 hash proof via extension
- Off-chain orchestrator with admin verify
- Single arbiter escrow on Fuji testnet
- Honest labeling: "proof hash", not "ZK proof"

### Phase 2: Attestor Integration
**Effort: 2-3 weeks**

1. Install `@reclaimprotocol/witness-sdk` in extension
2. Configure attestor endpoint (use Reclaim's hosted attestor or self-host)
3. Modify `venmoProofRunner.ts` to route Venmo API requests through attestor
4. Attestor co-signs TLS response data
5. Generate EIP-712 typed data attestation instead of SHA-256
6. Extension submits `attestationBytes` instead of `proofHash`

**Key files to modify:**
- `xramp-extension/src/lib/venmoProofRunner.ts` — replace direct fetch with attestor-routed TLS
- `xramp-extension/src/lib/orchestratorClient.ts` — update proof submission payload
- `xramp-extension/package.json` — add `@reclaimprotocol/witness-sdk`

### Phase 3: On-Chain Verification
**Effort: 3-4 weeks**

1. Deploy `UnifiedPaymentVerifier` (or simplified version) on Avalanche
2. Deploy `NullifierRegistry` on Avalanche
3. Add `releaseWithProof(escrowId, attestationBytes)` to `XRampEscrow.sol`
4. Verifier checks EIP-712 signature against trusted attestor address
5. Verifier nullifies payment ID to prevent double-spend
6. Remove `onlyArbiter` requirement for proof-verified releases

**New contracts to deploy:**
- `XRampPaymentVerifier.sol` — simplified EIP-712 attestation verifier
- `XRampNullifierRegistry.sol` — payment ID nullification
- Updated `XRampEscrow.sol` — add `releaseWithProof()`

### Phase 4: Multi-Provider Support
**Effort: 2-3 weeks**

1. Implement proof runners for CashApp, Zelle, Revolut, PayPal
2. Use `@zkp2p/providers` templates for each platform
3. Route each provider through attestor with appropriate template
4. Register each payment method in on-chain `PaymentVerifierRegistry`

**Files to create:**
- `xramp-extension/src/lib/cashappProofRunner.ts`
- `xramp-extension/src/lib/zelleProofRunner.ts`
- `xramp-extension/src/lib/revolutProofRunner.ts`
- `xramp-extension/src/lib/paypalProofRunner.ts`

### Phase 5: Full Peer Compatibility
**Effort: 4-6 weeks**

1. Move orchestrator logic on-chain (deploy `XRampOrchestrator.sol`)
2. Implement multi-maker deposit system
3. Add intent matching and fund locking on-chain
4. Add fee collection and distribution
5. Add post-intent hooks for composability (LFJ swap as on-chain hook)
6. Deploy on production chain (Base or Avalanche mainnet)

---

## 5. Interim Honest Framing

Until full Peer compatibility is achieved, XRamp should use this framing:

### What to say:
- "XRamp verifies fiat payments using the same provider templates as the Peer protocol (`@zkp2p/providers`)"
- "Payment proof is generated by matching Venmo transaction data and computing a SHA-256 commitment"
- "Settlement is authorized by a trusted arbiter after proof review"
- "The proof pipeline is designed for future upgrade to zkTLS attestation (Peer-compatible)"
- "Extension architecture follows ZKP2P patterns: provider template → data extraction → proof generation → submission"

### What NOT to say:
- ~~"XRamp uses zero-knowledge proofs"~~ (it uses SHA-256 hashing, not ZK)
- ~~"Trustless settlement"~~ (arbiter is a trusted party)
- ~~"On-chain verification"~~ (verification is off-chain admin review)
- ~~"Peer protocol compatible"~~ (not yet — aligned in design, not in implementation)

### Accurate technical description:
> XRamp implements a payment verification pipeline inspired by the Peer (ZKP2P) protocol. The extension captures Venmo payment data using the official `@zkp2p/providers` template, matches transactions by amount/receiver/timestamp, and computes a SHA-256 proof commitment. This proof is submitted to an off-chain orchestrator where a trusted arbiter verifies and releases escrowed funds. The architecture is designed for progressive upgrade to zkTLS attestation and on-chain verification as the Peer protocol matures.
