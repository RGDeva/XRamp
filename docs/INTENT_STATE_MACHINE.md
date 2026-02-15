# Intent State Machine (v0)

## States
- `created`
- `matching`
- `matched`
- `awaiting_peer_payment`
- `proof_submitted`
- `proof_verified`
- `settled`
- `match_timeout`
- `proof_rejected`
- `disputed`
- `cancelled`
- `failed`

## Allowed Transitions
- `created -> matching`
- `matching -> matched | match_timeout | cancelled`
- `matched -> awaiting_peer_payment | cancelled`
- `awaiting_peer_payment -> proof_submitted | match_timeout | disputed`
- `proof_submitted -> proof_verified | proof_rejected | disputed`
- `proof_verified -> settled`
- `proof_rejected -> awaiting_peer_payment | disputed | failed`
- `match_timeout -> matching | cancelled`
- `disputed -> settled | failed`

## Timeouts (initial)
- Match timeout: 180s
- Peer payment/proof timeout: 900s
- Dispute auto-escalation window: 1800s

## Event Contract
Every transition appends `event_log` row:
- `intent_id`
- `from_state`
- `to_state`
- `actor` (`user|peer|system|admin`)
- `reason_code`
- `metadata_json`
- `created_at`

## Idempotency Rules
- All webhook/event handlers require `idempotency_key`
- Duplicate transition to same state returns 200 no-op
- Invalid transition returns 409 + current state
