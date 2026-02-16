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

export interface CreateIntentPayload {
  type: 'ONRAMP' | 'SWAP' | 'WITHDRAW';
  userId: string;
  amount: string;
  sourceAsset: string;
  targetAsset: string;
}

export const orchestratorApi = {
  createOnrampIntent(payload: Omit<CreateIntentPayload, 'type'>) {
    return request<{ intent: { id: string; state: string } }>('/intents/onramp', {
      method: 'POST',
      body: JSON.stringify({ ...payload, type: 'ONRAMP' }),
    });
  },

  getIntent(intentId: string) {
    return request<{ intent: unknown; timeline: unknown[] }>(`/intents/${intentId}`);
  },

  transitionIntent(intentId: string, toState: string) {
    return request(`/intents/${intentId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ toState, actor: 'system' }),
    });
  },
};
