# XRamp 14-Day Execution Plan (2 Devs)

## Team Lanes
- **Dev A (Backend + State):** intent engine, matcher, proof pipeline, persistence
- **Dev B (Frontend + UX):** buy/sell flow wiring, real-time status, activity, retry UX

## Day 1-2
- Define DB schema (intents/offers/matches/proofs/events/disputes)
- Add API contracts: create intent, fetch intent, submit proof
- Replace mock types with real domain types

## Day 3-4
- Implement intent creation + state transitions
- Build matcher v1 (priority by method + amount fit + recent success rate)
- Add timeout workers (match + proof windows)

## Day 5-6
- Proof submission endpoint + attachment metadata
- Proof verification service interface (manual + rule-based v1)
- Frontend: wire Buy/Sell to real `/quote` + `/intent/create`

## Day 7
- Milestone demo: end-to-end sandbox flow from create -> settled

## Day 8-9
- Activity page from DB (remove mock data)
- Intent detail timeline from `event_log`
- Retry + failover UX for match timeout

## Day 10-11
- Webhook ingestion skeleton for external providers
- Idempotency handling + duplicate event tests
- Dispute creation flow + admin placeholder actions

## Day 12
- Performance pass on "time-to-first-match"
- Add counters/metrics endpoint (P50 time-to-cash, match success)

## Day 13
- Bug bash + edge cases
- Tighten copy, loading states, errors

## Day 14
- Launch candidate freeze
- Ship checklist + post-launch dashboard

## Must-ship Ticket List (P0)
1. Real quote endpoint integration (remove simulated math)
2. Intent state machine implementation
3. Matcher v1
4. Proof submission + verification decision
5. Activity/history from database
6. Retry on timeout path
7. Telemetry for wedge KPI
