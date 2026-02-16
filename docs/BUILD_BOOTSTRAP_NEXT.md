# Build Bootstrap — Immediate Next Engineering Moves

## Goal
Get from frontend shell to working sandbox orchestration quickly.

## Existing repo reality
- Frontend mostly ready
- Core flows currently simulated/mocked in places
- No complete orchestrator backend present yet

## Build next (concrete)

### 1) Add backend folder + contracts
Suggested structure:
- `/orchestrator` (API + state machine)
- `/contracts` (escrow interfaces + deployment artifacts)

### 2) Minimal API surface (v0)
- `POST /intents/onramp`
- `POST /intents/swap`
- `POST /intents/withdraw`
- `GET /intents/:id`
- `POST /intents/:id/transition` (internal)
- `GET /receipts/:intentId/export`

### 3) Canonical DB tables
- users
- wallets
- intents
- quotes
- transactions
- receipts
- event_log

### 4) Frontend wiring targets
- Replace local quote simulation in Buy/Sell pages
- Replace Activity mock data
- Render timeline from server event_log

### 5) Sandbox demo target
End-to-end one path with canonical states and receipt export.

## Definition of "started correctly"
- backend skeleton exists with running health endpoint
- canonical state enum implemented once
- one full intent lifecycle test passes
- frontend reads one real intent from backend
