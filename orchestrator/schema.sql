-- XRamp Orchestrator D1 Schema

CREATE TABLE IF NOT EXISTS intents (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ONRAMP', 'OFFRAMP', 'SWAP', 'WITHDRAW', 'SEND')),
  amount TEXT NOT NULL,
  sourceAsset TEXT NOT NULL,
  targetAsset TEXT NOT NULL,
  rail TEXT DEFAULT 'venmo',
  state TEXT NOT NULL DEFAULT 'CREATED',
  escrowId TEXT,
  depositTxHash TEXT,
  releaseTxHash TEXT,
  proofHash TEXT,
  paymentHandle TEXT,
  metaJson TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intents_userId ON intents(userId);
CREATE INDEX IF NOT EXISTS idx_intents_state ON intents(state);

CREATE TABLE IF NOT EXISTS event_log (
  id TEXT PRIMARY KEY,
  intentId TEXT NOT NULL,
  ts TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN ('user', 'peer', 'system', 'admin', 'webhook')),
  fromState TEXT NOT NULL,
  toState TEXT NOT NULL,
  metaJson TEXT DEFAULT '{}',
  FOREIGN KEY (intentId) REFERENCES intents(id)
);

CREATE INDEX IF NOT EXISTS idx_event_log_intentId ON event_log(intentId);

CREATE TABLE IF NOT EXISTS proofs (
  id TEXT PRIMARY KEY,
  intentId TEXT NOT NULL,
  providerId TEXT DEFAULT 'manual',
  verified INTEGER DEFAULT 0,
  proofHash TEXT,
  payloadJson TEXT DEFAULT '{}',
  ts TEXT NOT NULL,
  FOREIGN KEY (intentId) REFERENCES intents(id)
);

CREATE INDEX IF NOT EXISTS idx_proofs_intentId ON proofs(intentId);
