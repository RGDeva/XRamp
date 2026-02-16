# XRamp Orchestrator (bootstrap)

Minimal backend skeleton implementing canonical intent states and timeline/receipt export.

## Run
```bash
cd orchestrator
npm i
npm run dev
```

Server runs on `http://localhost:8787` by default.

## Endpoints (v0)
- `GET /health`
- `POST /intents/onramp`
- `POST /intents/swap`
- `POST /intents/withdraw`
- `GET /intents`
- `GET /intents/:id`
- `POST /intents/:id/transition`
- `GET /receipts/:intentId/export`

## Notes
- Storage is in-memory for bootstrap only.
- Replace store with DB-backed repositories next.
- State transitions are validated against canonical enum from docs.
