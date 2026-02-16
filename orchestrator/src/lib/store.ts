import { randomUUID } from 'node:crypto';
import { canTransition, type IntentState } from '../state.js';
import type { EventLog, Intent, IntentType } from '../types.js';

const intents = new Map<string, Intent>();
const eventLogs = new Map<string, EventLog[]>();

export function createIntent(input: {
  type: IntentType;
  userId: string;
  amount: string;
  sourceAsset: string;
  targetAsset: string;
}): Intent {
  const now = new Date().toISOString();
  const intent: Intent = {
    id: randomUUID(),
    type: input.type,
    userId: input.userId,
    amount: input.amount,
    sourceAsset: input.sourceAsset,
    targetAsset: input.targetAsset,
    state: 'CREATED',
    createdAt: now,
    updatedAt: now,
  };

  intents.set(intent.id, intent);
  eventLogs.set(intent.id, []);
  return intent;
}

export function getIntent(id: string): Intent | undefined {
  return intents.get(id);
}

export function listIntents(): Intent[] {
  return Array.from(intents.values());
}

export function transitionIntent(input: {
  intentId: string;
  toState: IntentState;
  actor: EventLog['actor'];
  reasonCode?: string;
  metadata?: Record<string, unknown>;
}): { intent: Intent; event: EventLog } {
  const intent = intents.get(input.intentId);
  if (!intent) throw new Error('Intent not found');

  if (intent.state === input.toState) {
    const event: EventLog = {
      id: randomUUID(),
      intentId: intent.id,
      fromState: intent.state,
      toState: input.toState,
      actor: input.actor,
      reasonCode: input.reasonCode,
      metadata: { ...(input.metadata || {}), idempotent: true },
      createdAt: new Date().toISOString(),
    };
    eventLogs.get(intent.id)?.push(event);
    return { intent, event };
  }

  if (!canTransition(intent.state, input.toState)) {
    throw new Error(`Invalid transition: ${intent.state} -> ${input.toState}`);
  }

  const prev = intent.state;
  intent.state = input.toState;
  intent.updatedAt = new Date().toISOString();

  const event: EventLog = {
    id: randomUUID(),
    intentId: intent.id,
    fromState: prev,
    toState: input.toState,
    actor: input.actor,
    reasonCode: input.reasonCode,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };

  eventLogs.get(intent.id)?.push(event);
  return { intent, event };
}

export function getIntentTimeline(intentId: string): EventLog[] {
  return eventLogs.get(intentId) || [];
}
