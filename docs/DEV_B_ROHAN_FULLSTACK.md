# Dev B Playbook — Rohan (Backend + Frontend)

## Mission
Turn XRamp from simulated UI into a real runnable flow.

## Ticket Map
- Core P0: #1 #2 #3 #4 #5 #6
- Infra P1: #7 #8 #9
- Ops P2: #10
- Coordination: #11 #16

## Execution Order (strict)
1. #1 State machine + event log
2. #2 Real quote API + wire UI
3. #3 Matcher v1
4. #4 Proof pipeline
5. #5 Real activity/history
6. #6 Embedded wallet wiring

## Concrete Build Tasks

### A) Backend contracts (API)
Implement endpoints:
- `POST /quote`
- `POST /intent/create`
- `GET /intent/:id`
- `POST /intent/:id/submit-proof`
- `POST /intent/:id/verify-proof`
- `GET /activity?userId=...`

Common requirements:
- idempotency key support
- strict state-transition checks
- event log write on every transition

### B) Database tables (minimum)
- `intents`
- `matches`
- `proofs`
- `event_log`
- `disputes`

### C) Frontend replacement work
- Remove quote simulation from `Buy.tsx` + `Sell.tsx`
- Use real quote data (fee, ttl, amount out)
- Replace `mockActivities` in `Activity.tsx` with API data
- Show live timeline from event log
- Keep retry UX for match timeout

### D) Trustware/Wallet wiring
- Use authenticated user embedded wallet for destination in embedded mode
- remove placeholder-only behavior
- fallback if user has no embedded wallet

### E) Reliability
- webhook dedup model + handler skeleton (#7)
- basic dispute create/list/resolve path (#8)
- CI workflow for lint/build/typecheck (#9)

## Definition of Done
- End-to-end sandbox path works:
  create intent -> match -> proof submit -> verify -> settled
- No hardcoded activity/quote data in UI
- All P0 issues closed with demo recording
- CI green on PR
