const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8787';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ORCHESTRATOR_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export type OrchestratorIntentState =
  | 'CREATED'
  | 'FUNDING'
  | 'FUNDED'
  | 'SWAPPING'
  | 'READY_TO_WITHDRAW'
  | 'WITHDRAWING'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELED'
  | 'EXPIRED';

export interface OrchestratorIntent {
  id: string;
  type: 'ONRAMP' | 'OFFRAMP' | 'SWAP' | 'WITHDRAW';
  userId: string;
  amount: string;
  sourceAsset: string;
  targetAsset: string;
  state: OrchestratorIntentState;
  createdAt: string;
  updatedAt: string;
}

export const orchestratorApi = {
  createOnrampIntent(payload: {
    userId: string;
    amount: string;
    sourceAsset: string;
    targetAsset: string;
  }) {
    return request<{ intent: OrchestratorIntent }>('/intents/onramp', {
      method: 'POST',
      body: JSON.stringify({ ...payload, type: 'ONRAMP' }),
    });
  },

  createOfframpIntent(payload: {
    userId: string;
    amount: string;
    sourceAsset: string;
    targetAsset: string;
  }) {
    return request<{ intent: OrchestratorIntent }>('/intents/offramp', {
      method: 'POST',
      body: JSON.stringify({ ...payload, type: 'OFFRAMP' }),
    });
  },

  listIntents(userId?: string) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return request<{ intents: OrchestratorIntent[] }>(`/intents${qs}`);
  },

  getIntent(intentId: string) {
    return request<{ intent: OrchestratorIntent; timeline: unknown[] }>(`/intents/${intentId}`);
  },

  transitionIntent(intentId: string, toState: OrchestratorIntentState) {
    return request(`/intents/${intentId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ toState, actor: 'system' }),
    });
  },
};
