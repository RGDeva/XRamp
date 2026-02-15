# OpenClaw Automations for XRamp (Immediate Use)

## 1) Intent Watchdog Agent
**Trigger:** every 2 minutes
**Checks:** intents stuck in `matching`, `awaiting_peer_payment`, `proof_submitted`
**Actions:**
- classify cause (`no_match`, `timeout`, `proof_pending`)
- post summary in ops channel
- create follow-up task for stale intents > SLA

## 2) Daily Routing Performance Brief
**Trigger:** daily 9:00 UTC
**Outputs:**
- match success by payment method
- P50/P90 time-to-match
- P50/P90 time-to-cash
- top 5 failure reasons

## 3) Dispute Queue Summarizer
**Trigger:** every 30 minutes
**Outputs:**
- open disputes count + aging buckets
- suggested priority order

## 4) Dev Standup Digest (for 2-dev team)
**Trigger:** weekdays 13:00 UTC
**Inputs:** GitHub issues + commits
**Outputs:**
- yesterday completed
- today planned
- blockers

## 5) Release Readiness Gate
**Trigger:** on demand before deploy
**Checks:**
- lint/build/test pass
- open P0 bug count
- unresolved critical incidents

---

## Minimal Data Needed for Agents
- `intents` table (state, created_at, updated_at)
- `event_log` table (transition events)
- `matches` table (method, latency, status)
- `proofs` table (status, reviewer_decision)
