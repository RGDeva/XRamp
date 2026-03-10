# XRAMP MASTER CONTEXT DOCUMENT

Version 1.1 (operationalized)

## One-line product description
XRamp orchestrates fiat-to-crypto ramps and swaps through an intent-based, non-custodial flow—delivering a clean 4-step user experience with receipts, tracking, and optional privacy mode.

## What XRamp is
XRamp is a universal liquidity routing layer for stablecoin-native users.

XRamp is **not**:
- a centralized exchange
- a bank
- a debit card issuer
- a “no-KYC bypass” product

XRamp is infrastructure that routes between:
- fiat payment rails (P2P rails initially)
- stablecoins
- on-chain swaps
- future credit/lending/settlement layers

## MVP UX (4-step)
1. **Amount**
2. **Funding** (escrow + payment verification)
3. **Swap** (Trustware optional)
4. **Withdraw** (external wallet + receipt)

UX constraints:
- minimal fintech-like copy
- embedded integrations where possible
- timeline + status + exportable receipts
- privacy mode as optional phase-2 path

## Canonical state machine
Canonical states across intent types:
- `CREATED`
- `FUNDING`
- `FUNDED`
- `SWAPPING`
- `READY_TO_WITHDRAW`
- `WITHDRAWING`
- `COMPLETE`

Edge states:
- `FAILED`
- `CANCELED`
- `EXPIRED`

Rules:
- every transition appends `event_log`
- server state is source-of-truth for UI
- receipt artifacts saved at relevant steps (proof refs, tx hashes, external refs)

## Core objects
- User
- Wallet
- Intent (ONRAMP, OFFRAMP, SWAP, WITHDRAW)
- Quote
- Transaction (onchain/offchain refs)
- Receipt
- EventLog

## Integrations
### Ramp Layer
- on-chain escrow + offchain payment verification
- proof-based settlement via Chrome extension

### Trustware (swap layer)
- USDC to target token routing

### Veil.cash (phase 2)
- optional privacy routing mode

## Messaging constraints
Preferred language:
- privacy-preserving
- selective disclosure
- policy-controlled verification

Avoid public framing like:
- “no-KYC bypass”
- “black market”
- “avoid taxes”

## Build phases
### Sprint 1 (foundation)
- backend orchestrator
- canonical intent endpoints
- transition validator + event log
- webhook skeletons
- wizard + timeline UI wired to mocked server truth

### Sprint 2 (integrations)
- Multi-rail proof verification
- Trustware real integration
- withdraw confirmations
- admin debug console

### Phase 2+
- privacy mode (Veil)
- region/method expansion
- partner API + SDK
- mobile proof generation + notifications

## Strategic north star
XRamp is building the programmable liquidity router for the stablecoin economy.