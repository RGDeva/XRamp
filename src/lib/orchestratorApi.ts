// ─── Demo-mode orchestrator (no real backend required) ───────────────────────
// Future: swap DEMO_MODE = false and point VITE_ORCHESTRATOR_URL at the real
// Cloudflare Worker to use live intent state machine.

const DEMO_MODE = true;

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
  rail?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

function uid() {
  return 'intent_' + Math.random().toString(36).slice(2, 10);
}

function iso(offsetMs = 0) {
  return new Date(Date.now() - offsetMs).toISOString();
}

// Seed realistic demo history that shows on first load
const SEED_INTENTS: OrchestratorIntent[] = [
  {
    id: 'intent_demo001',
    type: 'ONRAMP',
    userId: 'demo',
    amount: '100.00',
    sourceAsset: 'USD',
    targetAsset: 'USDC',
    state: 'COMPLETE',
    rail: 'venmo',
    createdAt: iso(1000 * 60 * 60 * 2),
    updatedAt: iso(1000 * 60 * 90),
  },
  {
    id: 'intent_demo002',
    type: 'OFFRAMP',
    userId: 'demo',
    amount: '250.00',
    sourceAsset: 'USDC',
    targetAsset: 'USD',
    state: 'COMPLETE',
    rail: 'cashapp',
    createdAt: iso(1000 * 60 * 60 * 24),
    updatedAt: iso(1000 * 60 * 60 * 23),
  },
  {
    id: 'intent_demo003',
    type: 'ONRAMP',
    userId: 'demo',
    amount: '500.00',
    sourceAsset: 'USD',
    targetAsset: 'AVAX',
    state: 'FUNDED',
    rail: 'zelle',
    createdAt: iso(1000 * 60 * 20),
    updatedAt: iso(1000 * 60 * 5),
  },
  {
    id: 'intent_demo004',
    type: 'ONRAMP',
    userId: 'demo',
    amount: '75.00',
    sourceAsset: 'USD',
    targetAsset: 'USDC',
    state: 'SWAPPING',
    rail: 'venmo',
    createdAt: iso(1000 * 60 * 8),
    updatedAt: iso(1000 * 60 * 2),
  },
];

// Runtime store — starts from seed, new intents appended
const _store: OrchestratorIntent[] = [...SEED_INTENTS];

function simDelay(ms = 300) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// Simulate state progression after creation (CREATED → FUNDING → FUNDED → COMPLETE)
async function progressIntent(id: string) {
  const transitions: OrchestratorIntentState[] = ['FUNDING', 'FUNDED', 'SWAPPING', 'COMPLETE'];
  for (const state of transitions) {
    await simDelay(3000);
    const intent = _store.find((i) => i.id === id);
    if (intent) {
      intent.state = state;
      intent.updatedAt = new Date().toISOString();
    }
  }
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const orchestratorApi = {
  async createOnrampIntent(payload: {
    userId: string;
    amount: string;
    sourceAsset: string;
    targetAsset: string;
    rail?: string;
  }): Promise<{ intent: OrchestratorIntent }> {
    await simDelay(350);
    const intent: OrchestratorIntent = {
      id: uid(),
      type: 'ONRAMP',
      userId: payload.userId,
      amount: payload.amount,
      sourceAsset: payload.sourceAsset,
      targetAsset: payload.targetAsset,
      state: 'CREATED',
      rail: payload.rail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    _store.unshift(intent);
    if (DEMO_MODE) progressIntent(intent.id);
    return { intent };
  },

  async createOfframpIntent(payload: {
    userId: string;
    amount: string;
    sourceAsset: string;
    targetAsset: string;
    rail?: string;
  }): Promise<{ intent: OrchestratorIntent }> {
    await simDelay(350);
    const intent: OrchestratorIntent = {
      id: uid(),
      type: 'OFFRAMP',
      userId: payload.userId,
      amount: payload.amount,
      sourceAsset: payload.sourceAsset,
      targetAsset: payload.targetAsset,
      state: 'CREATED',
      rail: payload.rail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    _store.unshift(intent);
    if (DEMO_MODE) progressIntent(intent.id);
    return { intent };
  },

  async listIntents(userId?: string): Promise<{ intents: OrchestratorIntent[] }> {
    await simDelay(200);
    // Return all demo seed + any user-created intents
    const intents = userId
      ? _store.filter((i) => i.userId === userId || i.userId === 'demo')
      : [..._store];
    return { intents: intents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
  },

  async getIntent(intentId: string): Promise<{ intent: OrchestratorIntent; timeline: unknown[] }> {
    await simDelay(150);
    const intent = _store.find((i) => i.id === intentId);
    if (!intent) throw new Error(`Intent ${intentId} not found`);
    return { intent, timeline: [] };
  },

  async transitionIntent(intentId: string, toState: OrchestratorIntentState): Promise<{ intent: OrchestratorIntent }> {
    await simDelay(150);
    const intent = _store.find((i) => i.id === intentId);
    if (!intent) throw new Error(`Intent ${intentId} not found`);
    intent.state = toState;
    intent.updatedAt = new Date().toISOString();
    return { intent };
  },
};
