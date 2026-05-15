# Peer.xyz Backend + XRamp Command Chat Integration Audit & Implementation Plan

## 1) Current repo audit (what exists today)

### Frontend orchestration is still demo-mode
- `src/lib/orchestratorApi.ts` is an in-memory mock (`DEMO_MODE = true`) and does not call any backend yet.
- Intents are simulated client-side and auto-progressed by timers.

### Backend orchestrator exists, but is generic and not Peer-wired
- `orchestrator/src/routes/intents.ts` exposes intent CRUD/state-transition routes.
- `orchestrator/src/lib/store.ts` persists intents/events to local `.data/store.json`.
- There is no Peer API client, webhook verification, quote locking, proof handling, payout instruction, or settlement reconciliation.

### Command chat UI is currently simulation-only
- `src/components/command/CommandMode.tsx` parses free text via regex and runs a fake LP simulation.
- No backend call is made for NLP, quote creation, intent creation, state polling, or confirmations.

## 2) Target architecture to integrate Peer

Use XRamp backend as the system-of-record + workflow engine, with Peer as the fiat rail and availability/offer source.

1. **Frontend**
   - Keep pages + command UI thin.
   - Call XRamp backend only (never Peer directly from browser).

2. **XRamp Orchestrator backend**
   - Owns intent lifecycle + idempotency + audit logs.
   - Calls Peer server-to-server for quote/offer/reservation + payment/proof state.
   - Receives Peer webhooks and translates them into canonical intent transitions.

3. **Peer API**
   - Provides rail/offer availability, order/intent primitives, payment confirmation events, and webhook callbacks (based on your account capabilities in Peer docs).

## 3) Backend integration blueprint (how to implement)

## A. Add modules in orchestrator
Create:
- `orchestrator/src/lib/peerClient.ts`
  - Typed HTTP client with `Authorization` header from `PEER_API_KEY`.
  - Methods:
    - `getQuote(...)`
    - `createOrder(...)`
    - `getOrder(orderId)`
    - `cancelOrder(orderId)`
- `orchestrator/src/lib/peerMapper.ts`
  - Map Peer statuses/events -> canonical states:
    - `created|awaiting_fiat` -> `FUNDING`
    - `fiat_received|proof_verified` -> `FUNDED`
    - `crypto_releasing|swap_started` -> `SWAPPING` or `WITHDRAWING`
    - `completed` -> `COMPLETE`
    - `failed|expired|canceled` -> `FAILED|EXPIRED|CANCELED`
- `orchestrator/src/routes/peerWebhook.ts`
  - Verifies Peer signature (HMAC/JWT per docs).
  - Idempotently stores webhook event id.
  - Applies transition via `transitionIntent`.

## B. Extend intent schema and persistence
Add to `Intent` (`orchestrator/src/types.ts` and store):
- `rail?: string`
- `paymentHandle?: string`
- `peerOrderId?: string`
- `peerStatus?: string`
- `quoteId?: string`
- `expiresAt?: string`
- `failureCode?: string`
- `txHash?: string`

Also add `idempotencyKey` support on create routes.

## C. Add server routes used by UI
Add endpoints:
- `POST /api/quotes`
  - Input: amount, source, target, rail, side (buy/sell)
  - Output: normalized quote + expiry
- `POST /api/intents/from-command`
  - Input: parsed command intent + user context
  - Backend: quote -> peer order -> local intent
  - Output: intent snapshot + immediate next action
- `GET /api/intents/:id/live`
  - Returns intent + timeline + derived UI step labels
- `POST /api/intents/:id/cancel`
  - Cancels Peer order (if possible), transitions local state.

## D. Webhook-first progression
Do not rely on timer-based progression.
- Primary progression source: Peer webhook events.
- Secondary safety: polling worker (every N seconds) to reconcile stale intents with `peerClient.getOrder`.

## E. Security/ops must-haves
- Env vars:
  - `PEER_BASE_URL`
  - `PEER_API_KEY`
  - `PEER_WEBHOOK_SECRET`
- Verify webhook signature and reject unknown IP ranges if Peer supports allowlisting.
- Use idempotency key on every create action from frontend.
- Structured logs: `intentId`, `peerOrderId`, `state_from`, `state_to`, `event_id`.

## 4) Make Command chat actually work with app

## A. Replace regex simulation with backend execution
In `src/components/command/CommandMode.tsx`:
- Keep local chat UX only.
- Replace `runSimulation` with:
  1. `POST /api/commands/parse` (or local parser fallback)
  2. `POST /api/intents/from-command`
  3. Stream/poll live updates from `/api/intents/:id/live`.

## B. Command contract
Define strict payload:
- input: `{ text: string, userId: string }`
- parsed intent output:
  - `action: 'buy' | 'sell'`
  - `amount: string`
  - `fiatCurrency: 'USD' | ...`
  - `crypto: 'USDC' | 'AVAX' | ...`
  - `rail: 'venmo' | 'cashapp' | ...`
  - `paymentHandle?: string`
  - `express?: boolean`

## C. UI event model
Map backend states to chat bubbles:
- `CREATED` -> “Order created”
- `FUNDING` -> “Waiting for fiat confirmation”
- `FUNDED` -> “Fiat received”
- `SWAPPING` -> “Swap executing”
- `WITHDRAWING` -> “Withdrawing to destination”
- `COMPLETE` -> “Order complete”
- terminal errors -> destructive bubble + retry CTA

## D. Reuse existing app navigation states
When command resolves intent creation, navigate into existing review routes with current state keys:
- buy flow: `payAmount`, `receiveAmount`, `paymentMethod`, `paymentHandle`, `currency`, `crypto`, `intentId`
- sell flow: `sellAmount`, `receiveAmount`, `payoutMethod`, `payoutHandle`, `currency`, `crypto`, `intentId`

This keeps command mode and normal form flows on the same execution rails.

## 5) Minimal phased rollout (recommended)

### Phase 1 — backend readiness
- Add Peer client + webhook route + mapper.
- Extend intent model with Peer linkage fields.
- Add `/api/quotes` and `/api/intents/from-command`.

### Phase 2 — wire normal Buy/Sell pages
- Flip frontend orchestrator client from demo store to HTTP transport.
- Send `rail` and `paymentHandle` on create.
- Surface quote expiry and backend validation errors.

### Phase 3 — wire Command mode
- Replace simulation with real command -> intent pipeline.
- Poll/stream intent states and render timeline bubbles.
- Add cancel/retry in chat UI.

### Phase 4 — reliability hardening
- Reconciliation worker for webhook misses.
- Idempotency + replay protection tests.
- Metrics dashboards for intent conversion and failure codes.

## 6) Gap checklist from this audit

- [ ] Replace demo orchestrator mode in frontend with real HTTP client.
- [ ] Add Peer-backed quote/order lifecycle in backend.
- [ ] Add authenticated webhook ingestion + status mapping.
- [ ] Unify command chat with same intent pipeline used by Buy/Sell forms.
- [ ] Persist Peer correlation IDs + payout/payment handles for traceability.

