# Intent State Machine (Canonical)

## Canonical states (all intent types)
- `CREATED`
- `FUNDING`
- `FUNDED`
- `SWAPPING`
- `READY_TO_WITHDRAW`
- `WITHDRAWING`
- `COMPLETE`

## Edge states
- `FAILED`
- `CANCELED`
- `EXPIRED`

## Transition guidance by flow

### Onramp intent
`CREATED -> FUNDING -> FUNDED -> (optional SWAPPING) -> READY_TO_WITHDRAW -> WITHDRAWING -> COMPLETE`

### Offramp intent
`CREATED -> FUNDING -> FUNDED -> COMPLETE`
(If swap path is included, include `SWAPPING` before completion.)

### Swap intent
`CREATED -> SWAPPING -> READY_TO_WITHDRAW -> WITHDRAWING -> COMPLETE`

### Withdraw intent
`CREATED -> WITHDRAWING -> COMPLETE`

## Failure transitions
- Any active state -> `FAILED`
- Any pre-complete state -> `CANCELED`
- Any time-boxed state -> `EXPIRED`

## Required transition side effects
Every transition must:
1. Append `event_log` row
2. Update intent status
3. Update timeline payload for UI
4. Persist receipt artifacts when available

## Event log fields (minimum)
- `intent_id`
- `from_state`
- `to_state`
- `actor` (`user|peer|system|admin|webhook`)
- `reason_code`
- `metadata_json`
- `created_at`

## Idempotency
- Mutating endpoints require idempotency key
- Duplicate transition to same target state = no-op + 200
- Invalid transition = 409 + current state

## Note
Payment matching, lock, proof, and verification are tracked in event metadata and receipt artifacts while the intent remains in canonical state progression above.