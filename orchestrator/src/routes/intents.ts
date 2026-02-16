import { Router } from 'express';
import { z } from 'zod';
import { CANONICAL_STATES } from '../state.js';
import { createIntent, getIntent, getIntentTimeline, listIntents, transitionIntent } from '../lib/store.js';

const router = Router();

const createIntentSchema = z.object({
  type: z.enum(['ONRAMP', 'OFFRAMP', 'SWAP', 'WITHDRAW']),
  userId: z.string().min(1),
  amount: z.string().min(1),
  sourceAsset: z.string().min(1),
  targetAsset: z.string().min(1),
});

const transitionSchema = z.object({
  toState: z.enum(CANONICAL_STATES),
  actor: z.enum(['user', 'peer', 'system', 'admin', 'webhook']).default('system'),
  reasonCode: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.post('/intents/onramp', (req, res) => {
  const parsed = createIntentSchema.extend({ type: z.literal('ONRAMP') }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const intent = createIntent(parsed.data);
  return res.status(201).json({ intent });
});

router.post('/intents/swap', (req, res) => {
  const parsed = createIntentSchema.extend({ type: z.literal('SWAP') }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const intent = createIntent(parsed.data);
  return res.status(201).json({ intent });
});

router.post('/intents/withdraw', (req, res) => {
  const parsed = createIntentSchema.extend({ type: z.literal('WITHDRAW') }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const intent = createIntent(parsed.data);
  return res.status(201).json({ intent });
});

router.get('/intents', (_req, res) => {
  res.json({ intents: listIntents() });
});

router.get('/intents/:id', (req, res) => {
  const intent = getIntent(req.params.id);
  if (!intent) return res.status(404).json({ error: 'Intent not found' });

  const timeline = getIntentTimeline(intent.id);
  res.json({ intent, timeline });
});

router.post('/intents/:id/transition', (req, res) => {
  const parsed = transitionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = transitionIntent({ intentId: req.params.id, ...parsed.data });
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Transition failed';
    const status = msg.includes('Invalid transition') ? 409 : 404;
    res.status(status).json({ error: msg });
  }
});

router.get('/receipts/:intentId/export', (req, res) => {
  const intent = getIntent(req.params.intentId);
  if (!intent) return res.status(404).json({ error: 'Intent not found' });

  const timeline = getIntentTimeline(intent.id);
  res.json({
    receipt: {
      intentId: intent.id,
      state: intent.state,
      amount: intent.amount,
      sourceAsset: intent.sourceAsset,
      targetAsset: intent.targetAsset,
      timeline,
      exportedAt: new Date().toISOString(),
    },
  });
});

export default router;
