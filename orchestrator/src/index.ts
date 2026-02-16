import express from 'express';
import cors from 'cors';
import intentsRouter from './routes/intents.js';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'xramp-orchestrator', time: new Date().toISOString() });
});

app.use('/', intentsRouter);

app.listen(port, () => {
  console.log(`XRamp orchestrator listening on :${port}`);
});
