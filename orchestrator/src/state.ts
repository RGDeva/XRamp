export const CANONICAL_STATES = [
  'CREATED',
  'FUNDING',
  'FUNDED',
  'SWAPPING',
  'READY_TO_WITHDRAW',
  'WITHDRAWING',
  'COMPLETE',
  'FAILED',
  'CANCELED',
  'EXPIRED',
] as const;

export type IntentState = (typeof CANONICAL_STATES)[number];

export const ALLOWED_TRANSITIONS: Record<IntentState, IntentState[]> = {
  CREATED: ['FUNDING', 'CANCELED', 'EXPIRED', 'FAILED'],
  FUNDING: ['FUNDED', 'CANCELED', 'EXPIRED', 'FAILED'],
  FUNDED: ['SWAPPING', 'READY_TO_WITHDRAW', 'COMPLETE', 'FAILED', 'EXPIRED'],
  SWAPPING: ['READY_TO_WITHDRAW', 'FAILED', 'EXPIRED'],
  READY_TO_WITHDRAW: ['WITHDRAWING', 'COMPLETE', 'FAILED', 'EXPIRED'],
  WITHDRAWING: ['COMPLETE', 'FAILED', 'EXPIRED'],
  COMPLETE: [],
  FAILED: [],
  CANCELED: [],
  EXPIRED: [],
};

export function canTransition(from: IntentState, to: IntentState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
