# Dev A Playbook — Prabhat (Smart Contracts)

## Mission
Ship minimal escrow contracts that support XRamp v0 flow:
`create -> lock -> proof verified -> release` with timeout/dispute hooks.

## In Scope (Now)
- Escrow contract(s) for matched offramp intents
- State + role checks
- Events for backend sync
- Tests for happy path + abuse cases
- Deployment script + exported addresses

## Ticket Map
- #12 Escrow skeleton
- #13 Proof verification hook interface
- #14 Timeout + dispute handling
- #15 Deployment + addresses pipeline

## Concrete Build Tasks

### 1) Contract state model
Create `EscrowStatus` enum:
- CREATED
- LOCKED
- PROOF_SUBMITTED
- VERIFIED
- RELEASED
- REJECTED
- DISPUTED
- EXPIRED

Store:
- `intentId` (bytes32/string hash)
- `maker`, `taker`
- `token`, `amount`
- `createdAt`, `expiresAt`
- `status`

### 2) Required functions
- `createEscrow(intentId, token, amount, maker, taker, expiresAt)`
- `submitProof(intentId, proofHash)`
- `markVerified(intentId)`
- `markRejected(intentId, reasonCode)`
- `release(intentId)`
- `expire(intentId)`
- `resolveDispute(intentId, releaseToMaker)`

### 3) Access controls (minimal)
- only matcher/orchestrator can create
- only designated verifier role can mark verified/rejected
- release allowed only from VERIFIED
- dispute resolver role for final override

### 4) Events (must-have)
- `EscrowCreated(intentId, maker, taker, token, amount)`
- `ProofSubmitted(intentId, proofHash)`
- `EscrowVerified(intentId)`
- `EscrowRejected(intentId, reasonCode)`
- `EscrowReleased(intentId, recipient, amount)`
- `EscrowDisputed(intentId)`
- `EscrowExpired(intentId)`

### 5) Tests (minimum)
- create escrow success
- unauthorized caller rejected
- cannot release before verified
- verified -> release success
- timeout marks expired
- dispute resolution path works

## Definition of Done
- All ticket acceptance criteria pass
- Test suite green locally
- ABI + addresses exported in versioned artifact
- README includes deploy + verify commands

## Hand-off to Rohan
Deliver:
- contract ABI JSON
- deployed addresses (by network)
- event schema table
- function call examples for backend integration
