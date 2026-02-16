import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canTransition, type IntentState } from '../state.js';
import type { EventLog, Intent, IntentType } from '../types.js';

interface PersistedStore {
  intents: Intent[];
  eventLogs: Record<string, EventLog[]>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../.data');
const dataFile = join(dataDir, 'store.json');

const intents = new Map<string, Intent>();
const eventLogs = new Map<string, EventLog[]>();

function ensureDataDir() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
}

function loadStore() {
  try {
    ensureDataDir();
    if (!existsSync(dataFile)) return;

    const raw = readFileSync(dataFile, 'utf8');
    const parsed = JSON.parse(raw) as PersistedStore;

    for (const intent of parsed.intents || []) intents.set(intent.id, intent);
    for (const [intentId, events] of Object.entries(parsed.eventLogs || {})) {
      eventLogs.set(intentId, events);
    }
  } catch (error) {
    console.error('Failed to load persisted store:', error);
  }
}

function saveStore() {
  try {
    ensureDataDir();
    const payload: PersistedStore = {
      intents: Array.from(intents.values()),
      eventLogs: Object.fromEntries(eventLogs.entries()),
    };
    writeFileSync(dataFile, JSON.stringify(payload, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to persist store:', error);
  }
}

loadStore();

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
  saveStore();
  return intent;
}

export function getIntent(id: string): Intent | undefined {
  return intents.get(id);
}

export function listIntents(filter?: { userId?: string }): Intent[] {
  const all = Array.from(intents.values());
  if (!filter?.userId) return all;
  return all.filter((intent) => intent.userId === filter.userId);
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
    saveStore();
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
  saveStore();
  return { intent, event };
}

export function getIntentTimeline(intentId: string): EventLog[] {
  return eventLogs.get(intentId) || [];
}
