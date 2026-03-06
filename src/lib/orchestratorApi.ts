// ─── XRamp Orchestrator API Client ────────────────────────────────────────────
// Calls the real Cloudflare Worker backend. Set VITE_ORCHESTRATOR_URL in .env.
// Falls back to localhost:8787 for local dev.

const BASE_URL =
  import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8787';

// ─── Token helper ─────────────────────────────────────────────────────────────
// Privy access token is fetched from the auth context and passed per-request.
// The caller is responsible for providing it via setAuthToken / getAuthToken.

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_authToken) h['Authorization'] = `Bearer ${_authToken}`;
  return h;
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: { ...headers(), ...(opts.headers as Record<string, string> || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || `API ${res.status}`);
  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrchestratorIntentState =
  | 'CREATED'
  | 'FUNDING'
  | 'FUNDED'
  | 'PROOF_SUBMITTED'
  | 'VERIFIED'
  | 'SWAPPING'
  | 'READY_TO_WITHDRAW'
  | 'WITHDRAWING'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELED'
  | 'EXPIRED';

export interface OrchestratorIntent {
  id: string;
  type: 'ONRAMP' | 'OFFRAMP' | 'SWAP' | 'WITHDRAW' | 'SEND';
  userId: string;
  amount: string;
  sourceAsset: string;
  targetAsset: string;
  state: OrchestratorIntentState;
  rail?: string;
  paymentHandle?: string;
  escrowId?: string;
  depositTxHash?: string;
  releaseTxHash?: string;
  proofHash?: string;
  metaJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrchestratorProof {
  id: string;
  intentId: string;
  providerId: string;
  verified: boolean | number;
  proofHash: string;
  payloadJson: string;
  ts: string;
}

export interface EventLogEntry {
  id: string;
  intentId: string;
  ts: string;
  actor: string;
  fromState: string;
  toState: string;
  metaJson: string;
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const orchestratorApi = {
  /** Create a new intent (BUY = ONRAMP, SELL = OFFRAMP, etc.) */
  async createIntent(payload: {
    type: string;
    amount: string;
    sourceAsset: string;
    targetAsset: string;
    rail?: string;
    paymentHandle?: string;
  }): Promise<{ intent: OrchestratorIntent }> {
    return apiFetch('/intents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Convenience: create ONRAMP intent */
  async createOnrampIntent(payload: {
    userId: string;
    amount: string;
    sourceAsset: string;
    targetAsset: string;
    rail?: string;
    paymentHandle?: string;
  }): Promise<{ intent: OrchestratorIntent }> {
    return this.createIntent({ ...payload, type: 'ONRAMP' });
  },

  /** Convenience: create OFFRAMP intent */
  async createOfframpIntent(payload: {
    userId: string;
    amount: string;
    sourceAsset: string;
    targetAsset: string;
    rail?: string;
    paymentHandle?: string;
  }): Promise<{ intent: OrchestratorIntent }> {
    return this.createIntent({ ...payload, type: 'OFFRAMP' });
  },

  /** List intents for a user (activity feed) */
  async listIntents(userId?: string): Promise<{ intents: OrchestratorIntent[] }> {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return apiFetch(`/intents${qs}`);
  },

  /** Get single intent with timeline and proofs */
  async getIntent(intentId: string): Promise<{
    intent: OrchestratorIntent;
    timeline: EventLogEntry[];
    proofs: OrchestratorProof[];
  }> {
    return apiFetch(`/intents/${intentId}`);
  },

  /** Advance intent state (e.g. CREATED → FUNDING → FUNDED) */
  async transitionIntent(
    intentId: string,
    toState: OrchestratorIntentState,
    extra?: { actor?: string; depositTxHash?: string; escrowId?: string; meta?: Record<string, unknown> }
  ): Promise<{ intent: OrchestratorIntent }> {
    return apiFetch(`/intents/${intentId}/state`, {
      method: 'PATCH',
      body: JSON.stringify({ toState, ...extra }),
    });
  },

  /** Submit a proof for an intent */
  async submitProof(intentId: string, payload: {
    proofHash?: string;
    providerId?: string;
    payload?: Record<string, unknown>;
  }): Promise<{ proof: OrchestratorProof }> {
    return apiFetch(`/intents/${intentId}/proof`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Backend: arbiter mints test USDC, creates + funds escrow on Fuji.
   * Transitions intent FUNDING → FUNDED. payee = user delivery address.
   */
  async fundEscrow(intentId: string, payee: string): Promise<{
    intent: OrchestratorIntent;
    escrowId: string;
    depositTxHash: string;
  }> {
    return apiFetch(`/intents/${intentId}/fund-escrow`, {
      method: 'POST',
      body: JSON.stringify({ payee }),
    });
  },

  /** Admin: verify proof and release escrow → COMPLETE */
  async verifyAndRelease(intentId: string): Promise<{
    intent: OrchestratorIntent;
    releaseTxHash: string | null;
  }> {
    return apiFetch(`/intents/${intentId}/verify`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};
