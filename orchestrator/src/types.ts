import type { IntentState } from './state.js';

export type IntentType = 'ONRAMP' | 'OFFRAMP' | 'SWAP' | 'WITHDRAW';

export interface Intent {
  id: string;
  type: IntentType;
  userId: string;
  amount: string;
  sourceAsset: string;
  targetAsset: string;
  state: IntentState;
  createdAt: string;
  updatedAt: string;
}

export interface EventLog {
  id: string;
  intentId: string;
  fromState: IntentState;
  toState: IntentState;
  actor: 'user' | 'peer' | 'system' | 'admin' | 'webhook';
  reasonCode?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
