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

// ─── Quote types ─────────────────────────────────────────────────────────────

export interface OrchestratorQuote {
  id: string;
  provider: string;
  outputAmount: string;
  feeAmount: string;
  feeBps: number;
  etaSeconds: number;
  routeType: 'xramp_lp' | 'external_lp' | 'peer_lp';
  /** Liquidity source: 'xramp_lp' = XRamp fallback LP, 'peer_lp' = live Peer/ZKP2P LP */
  source: 'xramp_lp' | 'peer_lp' | 'external_lp';
  isBest: boolean;
  fiatCurrency: string;
  destination?: Record<string, unknown> | null;
  /** Peer LP depositor address (only present on peer_lp quotes) */
  depositor?: string;
}

export interface GetQuotesResponse {
  quotes: OrchestratorQuote[];
  bestQuoteId: string | null;
  fiatAmount: number;
  fiatCurrency: string;
  /** How many quotes came from each source */
  sources?: { xramp_lp: number; peer_lp: number };
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const orchestratorApi = {
  /** Fetch ranked provider quotes. No auth required. */
  async getQuotes(params: {
    fiatAmount: string;
    fiatCurrency?: string;
    destination?: {
      chainId: number;
      token: string;
      recipientAddress: string;
      app?: string;
      memo?: string;
    };
    enabledProviders?: string[];
  }): Promise<GetQuotesResponse> {
    return apiFetch('/quotes', {
      method: 'POST',
      body: JSON.stringify({ fiatCurrency: 'USD', ...params }),
    });
  },

  /** Create a new intent (BUY = ONRAMP, SELL = OFFRAMP, etc.) */
  async createIntent(payload: {
    type: string;
    amount: string;
    sourceAsset: string;
    targetAsset: string;
    rail?: string;
    paymentHandle?: string;
    destination?: {
      chainId: number;
      token: string;
      recipientAddress: string;
      app?: string;
      memo?: string;
    };
    quoteId?: string;
    quoteSnapshot?: Record<string, unknown>;
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
    destination?: {
      chainId: number;
      token: string;
      recipientAddress: string;
      app?: string;
      memo?: string;
    };
    quoteId?: string;
    quoteSnapshot?: Record<string, unknown>;
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

  /** List intents for the authenticated user (activity feed) */
  async listIntents(): Promise<{ intents: OrchestratorIntent[] }> {
    return apiFetch('/intents');
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

  /**
   * Frontend: report escrow funding after user wallet signed the on-chain tx.
   * Transitions intent FUNDING → FUNDED. Used for Sell/offramp where user locks USDC.
   */
  async reportFunding(intentId: string, data: {
    escrowId: string;
    depositTxHash: string;
    payer: string;
    payee: string;
  }): Promise<{
    intent: OrchestratorIntent;
    escrowId: string;
    depositTxHash: string;
  }> {
    return apiFetch(`/intents/${intentId}/report-funding`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Avalanche DeFi composability demo: execute USDC → AVAX swap on
   * LFJ (Trader Joe) DEX · Fuji testnet. Only available for COMPLETE intents.
   * Uses LFJ testnet USDC pool on Fuji.
   */
  async swapOnLfj(intentId: string, recipient: string): Promise<{
    intent: OrchestratorIntent;
    swapTxHash: string;
  }> {
    return apiFetch(`/intents/${intentId}/swap`, {
      method: 'POST',
      body: JSON.stringify({ recipient }),
    });
  },

  /** Get saved payment handles for the authenticated user */
  async getPreferences(): Promise<{
    preferences: {
      userId?: string;
      venmoHandle?: string;
      cashappHandle?: string;
      paypalHandle?: string;
      zelleHandle?: string;
      wiseHandle?: string;
      revolutHandle?: string;
    };
  }> {
    return apiFetch('/preferences');
  },

  /** Save (upsert) one or more payment handles for the authenticated user */
  async savePreferences(data: {
    venmoHandle?: string;
    cashappHandle?: string;
    paypalHandle?: string;
    zelleHandle?: string;
    wiseHandle?: string;
    revolutHandle?: string;
  }): Promise<void> {
    await apiFetch('/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
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
