# XRamp MVP Clone Spec (Peer/ZKP2P-style)

## Goal
Ship a production-usable v0 offramp flow that is a 1:1 functional clone baseline, with one measurable wedge:

**Wedge:** fastest successful offramp (P50 minutes from intent create -> cash confirmed).

## Non-goals (v0)
- Universal swaps (Trustware) as core flow
- Broad chain/token matrix
- Advanced risk/compliance tooling
- Chrome extension

## v0 Scope
1. User creates offramp intent
2. Matcher assigns peer/offer
3. User follows payout instructions
4. Peer submits proof-of-payment
5. Intent confirms or escalates to dispute
6. Receipt + activity record

## v0 Required Entities
- `intent`
- `offer`
- `match`
- `proof`
- `event_log`
- `dispute`

## Single Corridor for Launch
- Chain: Base
- Token: USDC
- Payment methods: Venmo, Cash App (start with 2 only)

## Success Criteria
- P50 time-to-cash <= 12 minutes (internal target)
- Match success >= 70%
- Dispute rate <= 8%
- Complete-flow conversion >= 35%

## Product Wedge Implementation Notes
- Default to "fastest available method"
- Show only top 2 methods on first screen
- Auto-refresh status every 3–5s during active intent
- One-tap retry from failed/match-timeout
