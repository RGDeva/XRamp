# XRamp Orchestrator — Cloudflare Worker + D1

Backend API for the XRamp P2P on/off-ramp. Manages intents, state machine, proofs, and escrow release.

## Setup

```bash
cd orchestrator
npm install

# Create D1 database (one-time)
npx wrangler d1 create xramp-orchestrator-db
# → Copy the database_id into wrangler.toml

# Run migrations
npm run db:migrate:local   # local dev
npm run db:migrate         # remote (after deploy)

# Set secrets
npx wrangler secret put PRIVY_APP_SECRET
npx wrangler secret put ARBITER_PRIVATE_KEY
```

## Local Dev

```bash
npm run dev   # starts wrangler dev on http://localhost:8787
```

## Deploy

```bash
npm run deploy   # deploys to Cloudflare Workers
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/intents` | Yes | Create intent |
| GET | `/intents?userId=...` | Yes | List intents for user |
| GET | `/intents/:id` | Yes | Get intent + timeline + proofs |
| PATCH | `/intents/:id/state` | Yes | Advance intent state |
| POST | `/intents/:id/proof` | Yes | Submit proof |
| POST | `/intents/:id/verify` | Admin | Verify proof + release escrow → COMPLETE |

## State Machine

```
CREATED → FUNDING → FUNDED → SWAPPING → READY_TO_WITHDRAW → WITHDRAWING → COMPLETE
                                    ↘ COMPLETE (direct from FUNDED for simple flows)
Any active state → FAILED / CANCELED / EXPIRED
```

## Auth

All `/intents` endpoints require a Privy JWT in `Authorization: Bearer <token>`.
Admin endpoints additionally check `ADMIN_EMAILS` / `ADMIN_WALLET_ADDRESSES` env vars.
