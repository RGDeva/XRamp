/**
 * XRamp Orchestrator — Cloudflare Worker with D1
 *
 * Endpoints:
 *   POST   /intents                 create intent
 *   GET    /intents?userId=...      list intents
 *   GET    /intents/:id             single intent + timeline
 *   PATCH  /intents/:id/state       advance state
 *   POST   /intents/:id/proof       submit proof
 *   POST   /intents/:id/verify      admin: verify + release escrow
 *   POST   /intents/:id/fund-escrow backend: arbiter mints+funds escrow, transitions FUNDING→FUNDED
 *   POST   /intents/:id/swap        Avalanche DeFi composability demo (USDC→AVAX on LFJ/Trader Joe, Fuji testnet)
 *   GET    /health                  health check
 */

import { verifyAuth, isAdmin } from './auth';
import { ALLOWED_TRANSITIONS, type IntentState } from './state';

export interface Env {
  DB: D1Database;
  PRIVY_APP_ID: string;
  PRIVY_APP_SECRET: string;
  ADMIN_EMAILS: string;
  ADMIN_WALLET_ADDRESSES: string;
  FUJI_RPC_URL: string;
  ESCROW_CONTRACT_ADDRESS: string;
  MOCK_USDC_ADDRESS: string;
  ARBITER_PRIVATE_KEY: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID();
}

function iso(): string {
  return new Date().toISOString();
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

function cors(response: Response, origin: string): Response {
  const h = new Headers(response.headers);
  h.set('Access-Control-Allow-Origin', origin || '*');
  h.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  h.set('Access-Control-Max-Age', '86400');
  return new Response(response.body, { status: response.status, headers: h });
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

function canTransition(from: string, to: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[from as IntentState];
  return !!allowed && allowed.includes(to as IntentState);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }), origin);
    }

    // Health
    if (url.pathname === '/health' && request.method === 'GET') {
      return cors(json({ ok: true, service: 'xramp-orchestrator', time: iso() }), origin);
    }

    // ── Auth ──────────────────────────────────────────────────────────────
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userWallet: string | null = null;

    // All /intents and /preferences routes require auth
    if (url.pathname.startsWith('/intents') || url.pathname.startsWith('/preferences')) {
      const authResult = await verifyAuth(request, env);
      if (!authResult.ok) {
        return cors(err(authResult.error || 'Unauthorized', 401), origin);
      }
      userId = authResult.userId!;
      userEmail = authResult.email || null;
      userWallet = authResult.wallet || null;
    }

    // ── POST /intents ────────────────────────────────────────────────────
    if (url.pathname === '/intents' && request.method === 'POST') {
      const body = await request.json<Record<string, unknown>>();
      const type = body.type as string;
      const amount = body.amount as string;
      const sourceAsset = body.sourceAsset as string;
      const targetAsset = body.targetAsset as string;
      const rail = (body.rail as string) || 'venmo';
      const paymentHandle = (body.paymentHandle as string) || '';

      if (!type || !amount || !sourceAsset || !targetAsset) {
        return cors(err('Missing required fields: type, amount, sourceAsset, targetAsset'), origin);
      }

      const id = uid();
      const now = iso();

      await env.DB.prepare(
        `INSERT INTO intents (id, userId, type, amount, sourceAsset, targetAsset, rail, paymentHandle, state, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', ?, ?)`
      ).bind(id, userId, type, amount, sourceAsset, targetAsset, rail, paymentHandle, now, now).run();

      // Write creation event
      await env.DB.prepare(
        `INSERT INTO event_log (id, intentId, ts, actor, fromState, toState, metaJson)
         VALUES (?, ?, ?, 'user', '', 'CREATED', '{}')`
      ).bind(uid(), id, now).run();

      const intent = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(id).first();
      return cors(json({ intent }, 201), origin);
    }

    // ── GET /intents ─────────────────────────────────────────────────────
    if (url.pathname === '/intents' && request.method === 'GET') {
      // Always use the JWT-authenticated userId (Privy DID) — never trust query param
      const rows = await env.DB.prepare(
        'SELECT * FROM intents WHERE userId = ? ORDER BY updatedAt DESC LIMIT 100'
      ).bind(userId).all();
      return cors(json({ intents: rows.results }), origin);
    }

    // ── GET /preferences ─────────────────────────────────────────────────
    if (url.pathname === '/preferences' && request.method === 'GET') {
      const row = await env.DB.prepare(
        'SELECT * FROM user_preferences WHERE userId = ?'
      ).bind(userId).first();
      return cors(json({ preferences: row || { userId, venmoHandle: '', cashappHandle: '', paypalHandle: '', zelleHandle: '' } }), origin);
    }

    // ── PUT /preferences ──────────────────────────────────────────────────
    if (url.pathname === '/preferences' && request.method === 'PUT') {
      const body = await request.json<Record<string, string>>();
      const now = iso();
      await env.DB.prepare(
        `INSERT INTO user_preferences (userId, venmoHandle, cashappHandle, paypalHandle, zelleHandle, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(userId) DO UPDATE SET
           venmoHandle   = COALESCE(excluded.venmoHandle,   venmoHandle),
           cashappHandle = COALESCE(excluded.cashappHandle, cashappHandle),
           paypalHandle  = COALESCE(excluded.paypalHandle,  paypalHandle),
           zelleHandle   = COALESCE(excluded.zelleHandle,   zelleHandle),
           updatedAt     = excluded.updatedAt`
      ).bind(
        userId,
        body.venmoHandle   ?? null,
        body.cashappHandle ?? null,
        body.paypalHandle  ?? null,
        body.zelleHandle   ?? null,
        now,
      ).run();
      const updated = await env.DB.prepare('SELECT * FROM user_preferences WHERE userId = ?').bind(userId).first();
      return cors(json({ preferences: updated }), origin);
    }

    // ── Routes with :id ──────────────────────────────────────────────────
    const intentMatch = url.pathname.match(/^\/intents\/([^/]+)$/);
    const stateMatch = url.pathname.match(/^\/intents\/([^/]+)\/state$/);
    const proofMatch = url.pathname.match(/^\/intents\/([^/]+)\/proof$/);
    const verifyMatch = url.pathname.match(/^\/intents\/([^/]+)\/verify$/);
    const fundEscrowMatch = url.pathname.match(/^\/intents\/([^/]+)\/fund-escrow$/);
    const reportFundingMatch = url.pathname.match(/^\/intents\/([^/]+)\/report-funding$/);
    const swapMatch = url.pathname.match(/^\/intents\/([^/]+)\/swap$/);

    // ── GET /intents/:id ─────────────────────────────────────────────────
    if (intentMatch && request.method === 'GET') {
      const id = intentMatch[1];
      const intent = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(id).first();
      if (!intent) return cors(err('Intent not found', 404), origin);

      const timeline = await env.DB.prepare(
        'SELECT * FROM event_log WHERE intentId = ? ORDER BY ts ASC'
      ).bind(id).all();

      const proofs = await env.DB.prepare(
        'SELECT * FROM proofs WHERE intentId = ? ORDER BY ts ASC'
      ).bind(id).all();

      return cors(json({ intent, timeline: timeline.results, proofs: proofs.results }), origin);
    }

    // ── PATCH /intents/:id/state ─────────────────────────────────────────
    if (stateMatch && request.method === 'PATCH') {
      const id = stateMatch[1];
      const body = await request.json<Record<string, unknown>>();
      const toState = body.toState as string;
      const actor = (body.actor as string) || 'user';
      const meta = body.meta || {};

      if (!toState) return cors(err('Missing toState'), origin);

      const intent = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(id).first<Record<string, unknown>>();
      if (!intent) return cors(err('Intent not found', 404), origin);

      const fromState = intent.state as string;

      if (!canTransition(fromState, toState)) {
        return cors(err(`Invalid transition: ${fromState} -> ${toState}`, 409), origin);
      }

      const now = iso();
      // Update intent state + any metadata fields
      const depositTxHash = (body.depositTxHash as string) || (intent.depositTxHash as string) || null;
      const escrowId = (body.escrowId as string) || (intent.escrowId as string) || null;

      await env.DB.prepare(
        `UPDATE intents SET state = ?, updatedAt = ?, depositTxHash = COALESCE(?, depositTxHash), escrowId = COALESCE(?, escrowId) WHERE id = ?`
      ).bind(toState, now, depositTxHash, escrowId, id).run();

      // Write event
      await env.DB.prepare(
        `INSERT INTO event_log (id, intentId, ts, actor, fromState, toState, metaJson)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(uid(), id, now, actor, fromState, toState, JSON.stringify(meta)).run();

      const updated = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(id).first();
      return cors(json({ intent: updated }), origin);
    }

    // ── POST /intents/:id/fund-escrow ────────────────────────────────────
    if (fundEscrowMatch && request.method === 'POST') {
      const intentId = fundEscrowMatch[1];
      const body = await request.json<Record<string, unknown>>();
      const payee = body.payee as string;

      if (!payee) return cors(err('Missing payee address'), origin);

      const intent = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(intentId).first<Record<string, unknown>>();
      if (!intent) return cors(err('Intent not found', 404), origin);

      const currentState = intent.state as string;
      if (currentState === 'FUNDED' || currentState === 'PROOF_SUBMITTED' || currentState === 'COMPLETE') {
        return cors(json({ intent }), origin);
      }

      try {
        const { fundEscrowForIntent } = await import('./escrow');
        const { escrowId, depositTxHash, payer } = await fundEscrowForIntent(
          env,
          intent.amount as string,
          payee,
        );

        const now = iso();
        const existingMeta = JSON.parse((intent.metaJson as string) || '{}');
        const updatedMeta = JSON.stringify({ ...existingMeta, payer, payee, token: env.MOCK_USDC_ADDRESS });

        await env.DB.prepare(
          `UPDATE intents SET state = 'FUNDED', escrowId = ?, depositTxHash = ?, metaJson = ?, updatedAt = ? WHERE id = ?`
        ).bind(escrowId, depositTxHash, updatedMeta, now, intentId).run();

        await env.DB.prepare(
          `INSERT INTO event_log (id, intentId, ts, actor, fromState, toState, metaJson)
           VALUES (?, ?, ?, 'system', ?, 'FUNDED', ?)`
        ).bind(uid(), intentId, now, currentState, JSON.stringify({ escrowId, depositTxHash })).run();

        const updated = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(intentId).first();
        return cors(json({ intent: updated, escrowId, depositTxHash }, 200), origin);
      } catch (e) {
        console.error('fundEscrow failed:', e);
        return cors(err(`Escrow funding failed: ${(e as Error).message}`, 500), origin);
      }
    }

    // ── POST /intents/:id/report-funding (user-wallet-signed) ───────────
    if (reportFundingMatch && request.method === 'POST') {
      const intentId = reportFundingMatch[1];
      const body = await request.json<Record<string, unknown>>();
      const escrowId = body.escrowId as string;
      const depositTxHash = body.depositTxHash as string;
      const payer = body.payer as string;
      const payee = body.payee as string;

      if (!escrowId || !depositTxHash) {
        return cors(err('Missing escrowId or depositTxHash'), origin);
      }

      const intent = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(intentId).first<Record<string, unknown>>();
      if (!intent) return cors(err('Intent not found', 404), origin);

      const currentState = intent.state as string;
      if (currentState === 'FUNDED' || currentState === 'PROOF_SUBMITTED' || currentState === 'COMPLETE') {
        return cors(json({ intent }), origin);
      }

      const now = iso();
      const existingMeta = JSON.parse((intent.metaJson as string) || '{}');
      const updatedMeta = JSON.stringify({ ...existingMeta, payer, payee, token: env.MOCK_USDC_ADDRESS, fundedBy: 'user-wallet' });

      await env.DB.prepare(
        `UPDATE intents SET state = 'FUNDED', escrowId = ?, depositTxHash = ?, metaJson = ?, updatedAt = ? WHERE id = ?`
      ).bind(escrowId, depositTxHash, updatedMeta, now, intentId).run();

      await env.DB.prepare(
        `INSERT INTO event_log (id, intentId, ts, actor, fromState, toState, metaJson)
         VALUES (?, ?, ?, 'user', ?, 'FUNDED', ?)`
      ).bind(uid(), intentId, now, currentState, JSON.stringify({ escrowId, depositTxHash, payer })).run();

      const updated = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(intentId).first();
      return cors(json({ intent: updated, escrowId, depositTxHash }, 200), origin);
    }

    // ── POST /intents/:id/proof ──────────────────────────────────────────
    if (proofMatch && request.method === 'POST') {
      const intentId = proofMatch[1];
      const body = await request.json<Record<string, unknown>>();

      const intent = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(intentId).first<Record<string, unknown>>();
      if (!intent) return cors(err('Intent not found', 404), origin);

      const proofId = uid();
      const now = iso();
      const proofHash = (body.proofHash as string) || '';
      const providerId = (body.providerId as string) || 'manual';
      const payloadJson = JSON.stringify(body.payload || {});

      await env.DB.prepare(
        `INSERT INTO proofs (id, intentId, providerId, verified, proofHash, payloadJson, ts)
         VALUES (?, ?, ?, 0, ?, ?, ?)`
      ).bind(proofId, intentId, providerId, proofHash, payloadJson, now).run();

      // Update intent proofHash + auto-transition to PROOF_SUBMITTED if eligible
      const currentState = intent.state as string;
      const shouldTransition = currentState === 'FUNDED' || currentState === 'FUNDING';
      const newState = shouldTransition ? 'PROOF_SUBMITTED' : currentState;

      await env.DB.prepare(
        'UPDATE intents SET proofHash = ?, state = ?, updatedAt = ? WHERE id = ?'
      ).bind(proofHash, newState, now, intentId).run();

      if (shouldTransition) {
        await env.DB.prepare(
          `INSERT INTO event_log (id, intentId, ts, actor, fromState, toState, metaJson)
           VALUES (?, ?, ?, 'system', ?, 'PROOF_SUBMITTED', '{}')`
        ).bind(uid(), intentId, now, currentState).run();
      }

      const updatedIntent = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(intentId).first();
      return cors(json({ proof: { id: proofId, intentId, proofHash, providerId, verified: false }, intent: updatedIntent }, 201), origin);
    }

    // ── POST /intents/:id/verify (ADMIN ONLY) ───────────────────────────
    if (verifyMatch && request.method === 'POST') {
      if (!isAdmin(userEmail, userWallet, env)) {
        return cors(err(`Forbidden: admin only. Extracted email=${userEmail ?? 'null'} wallet=${userWallet ?? 'null'}`, 403), origin);
      }

      const intentId = verifyMatch[1];
      const intent = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(intentId).first<Record<string, unknown>>();
      if (!intent) return cors(err('Intent not found', 404), origin);

      const fromState = intent.state as string;
      if (fromState === 'COMPLETE') {
        return cors(json({ intent, message: 'Already complete' }), origin);
      }

      // Mark proofs as verified
      const now = iso();
      await env.DB.prepare(
        'UPDATE proofs SET verified = 1 WHERE intentId = ?'
      ).bind(intentId).run();

      // Try to release escrow on-chain if we have an escrowId
      let releaseTxHash: string | null = null;
      const escrowId = intent.escrowId as string;
      if (escrowId && env.ARBITER_PRIVATE_KEY && env.ESCROW_CONTRACT_ADDRESS) {
        try {
          // Import the release function dynamically
          const { releaseEscrow } = await import('./escrow');
          releaseTxHash = await releaseEscrow(env, escrowId);
        } catch (e) {
          console.error('Escrow release failed:', e);
          // Continue — we still mark verified, admin can retry
        }
      }

      // Transition to COMPLETE
      const existingMeta = JSON.parse((intent.metaJson as string) || '{}');
      let swapTxHash: string | null = null;

      // Auto LFJ swap: if this is an ONRAMP intent, swap USDC → AVAX on Trader Joe
      const recipient = existingMeta.payee as string || '';
      if (intent.type === 'ONRAMP' && recipient && releaseTxHash) {
        try {
          const { swapUsdcToAvaxOnLfj } = await import('./lfj');
          const swapResult = await swapUsdcToAvaxOnLfj(env, intent.amount as string, recipient);
          swapTxHash = swapResult.swapTxHash;
        } catch (e) {
          console.error('Auto LFJ swap failed (non-blocking):', e);
          // Non-blocking — release succeeded, swap can be retried manually
        }
      }

      const updatedMeta = JSON.stringify({
        ...existingMeta,
        releaseTxHash,
        ...(swapTxHash ? { swapTxHash, swapDex: 'LFJ (Trader Joe)', swapPair: 'USDC→AVAX', swapAmountIn: intent.amount } : {}),
      });

      await env.DB.prepare(
        `UPDATE intents SET state = 'COMPLETE', updatedAt = ?, releaseTxHash = COALESCE(?, releaseTxHash), metaJson = ? WHERE id = ?`
      ).bind(now, releaseTxHash, updatedMeta, intentId).run();

      await env.DB.prepare(
        `INSERT INTO event_log (id, intentId, ts, actor, fromState, toState, metaJson)
         VALUES (?, ?, ?, 'admin', ?, 'COMPLETE', ?)`
      ).bind(uid(), intentId, now, fromState, JSON.stringify({ releaseTxHash, swapTxHash, verifiedBy: userEmail || userWallet })).run();

      const updated = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(intentId).first();
      return cors(json({ intent: updated, releaseTxHash, swapTxHash }), origin);
    }

    // ── POST /intents/:id/swap (Avalanche DeFi composability demo) ──────────
    if (swapMatch && request.method === 'POST') {
      const intentId = swapMatch[1];
      const body = await request.json<Record<string, unknown>>();
      const recipient = (body.recipient as string) || '';

      if (!recipient) return cors(err('Missing recipient address'), origin);

      const intent = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(intentId).first<Record<string, unknown>>();
      if (!intent) return cors(err('Intent not found', 404), origin);

      const currentState = intent.state as string;
      if (currentState !== 'COMPLETE') {
        return cors(err(`Swap only available for COMPLETE intents (current: ${currentState})`, 409), origin);
      }

      // Check if already swapped
      const existingMeta = JSON.parse((intent.metaJson as string) || '{}');
      if (existingMeta.swapTxHash) {
        return cors(json({ intent, swapTxHash: existingMeta.swapTxHash, message: 'Already swapped' }), origin);
      }

      try {
        const { swapUsdcToAvaxOnLfj } = await import('./lfj');
        const { swapTxHash, amountIn } = await swapUsdcToAvaxOnLfj(
          env,
          intent.amount as string,
          recipient,
        );

        const now = iso();
        const updatedMeta = JSON.stringify({ ...existingMeta, swapTxHash, swapDex: 'LFJ (Trader Joe)', swapPair: 'USDC→AVAX', swapAmountIn: amountIn });

        await env.DB.prepare(
          `UPDATE intents SET metaJson = ?, updatedAt = ? WHERE id = ?`
        ).bind(updatedMeta, now, intentId).run();

        await env.DB.prepare(
          `INSERT INTO event_log (id, intentId, ts, actor, fromState, toState, metaJson)
           VALUES (?, ?, ?, 'system', 'COMPLETE', 'COMPLETE', ?)`
        ).bind(uid(), intentId, now, JSON.stringify({ swapTxHash, swapDex: 'LFJ', swapPair: 'USDC→AVAX' })).run();

        const updated = await env.DB.prepare('SELECT * FROM intents WHERE id = ?').bind(intentId).first();
        return cors(json({ intent: updated, swapTxHash }, 200), origin);
      } catch (e) {
        console.error('LFJ swap failed:', e);
        return cors(err(`LFJ swap failed: ${(e as Error).message}`, 500), origin);
      }
    }

    return cors(err('Not found', 404), origin);
  },
};
