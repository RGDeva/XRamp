# XRamp

XRamp is a fiat-to-crypto onramp/offramp that settles on Avalanche via escrow contracts. Users pay with Venmo (or other fiat rails), submit payment proof, and receive MockUSDC on Avalanche Fuji testnet after admin verification.

## What is real vs. demo vs. future

### Fully real (on-chain, verifiable)
- **Escrow funding** — real `createEscrow` + `deposit` transactions on Avalanche Fuji
- **Escrow release** — real `releaseEscrow` transaction after proof verification
- **Payment proof** — real Venmo proof hash captured by the XRamp Chrome extension
- **LFJ swap** — real USDC → AVAX swap on LFJ (Trader Joe) V2.1 DEX on Fuji (post-settlement composability demo)

### Demo / testnet
- **MockUSDC** — open-mint test ERC20 (not real USDC). Rate is fixed 1:1 for demo.
- **Fees** — hardcoded 0.5% (buy) / 1% (sell), clearly labeled as demo rates
- **Single LP** — all liquidity provided by XRamp backend (arbiter wallet), not a multi-provider marketplace
- **LFJ token difference** — LFJ testnet uses its own USDC (`0xB607…`), different from escrow MockUSDC (`0xb2F4…`). On mainnet these would be the same real USDC.

### Future
- **Multi-LP marketplace** — Peer.xyz's liquidity network is referenced as the future quoting engine; current demo uses XRamp's single LP
- **Real USDC on mainnet** — production deployment with real stablecoins
- **Automated proof verification** — currently admin-triggered
- **Chrome extension SDK** — drop-in widget for partners

## Architecture

```
XRamp/
├── src/                    # React frontend (Vite + Tailwind + shadcn/ui)
│   ├── pages/              # Route pages: Home, Buy, Sell, Activity, etc.
│   ├── components/         # UI components (shared, layout, deposits)
│   ├── contexts/           # AuthContext (Privy), AppContext
│   └── lib/
│       ├── orchestratorApi.ts   # HTTP client for backend
│       ├── fuji.ts              # Fuji chain utils (balance, escrow, explorer)
│       └── fujiConfig.json      # Deployed contract addresses
├── orchestrator/           # Cloudflare Worker + D1 backend
│   ├── src/worker.ts       # Main Worker entry (all endpoints)
│   ├── src/auth.ts         # Privy JWT verification
│   ├── src/escrow.ts       # On-chain escrow release (ethers.js)
│   ├── src/state.ts        # Intent state machine
│   ├── schema.sql          # D1 tables: intents, event_log, proofs
│   └── wrangler.toml       # Cloudflare config
├── contracts/              # Hardhat project (Fuji testnet)
│   ├── contracts/MockUSDC.sol      # Mintable test ERC20 (6 decimals)
│   ├── contracts/XRampEscrow.sol   # Escrow: create → deposit → release/cancel
│   └── scripts/deploy.ts          # Deploy script → writes deployed.json
```

## Local Development

```bash
# 1. Start the orchestrator backend
cd orchestrator
npm install
npm run db:migrate:local
npm run dev                  # → http://localhost:8787

# 2. Start the frontend (separate terminal)
cd ..
npm install --legacy-peer-deps
npm run dev                  # → http://localhost:5173

# 3. (Optional) Build Chrome extension
cd ../xramp-extension
npm install --legacy-peer-deps
npm run build
# Load build/ as unpacked extension in chrome://extensions
```

## Deploy

```bash
# Deploy contracts to Fuji (needs DEPLOYER_PRIVATE_KEY env var with AVAX)
cd contracts && DEPLOYER_PRIVATE_KEY=0x... npx hardhat run scripts/deploy.ts --network fuji

# Deploy orchestrator to Cloudflare
cd orchestrator
npx wrangler d1 create xramp-orchestrator-db  # one-time
# Copy database_id into wrangler.toml
npm run db:migrate
npx wrangler secret put PRIVY_APP_SECRET
npx wrangler secret put ARBITER_PRIVATE_KEY
npm run deploy

# Update .env with production worker URL, then push
# Vercel auto-deploys from main branch
```

## Hackathon Demo Script

See [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) for the full judge-facing demo script with exact clicks, labels, and narration.

### Quick Demo Flow

1. **Open** → `https://xramp-app.vercel.app` → Log in with Privy
2. **Buy** → Enter amount → Select Venmo → Continue → Review (shows "XRamp LP funds escrow", "Settlement: Avalanche Fuji · MockUSDC") → Confirm
3. **Escrow funded** → See "Escrow funded by XRamp LP" with Fuji testnet badge, depositTxHash → Snowtrace link
4. **Pay via Venmo** → Use XRamp extension → "Verify with Venmo (Beta)" → Submit proof
5. **Activity** → See intent with Proof Hash (verified badge), Escrow Deposit (Fuji), Funded by: XRamp LP
6. **Admin verify** → Click "Verify + Release Escrow" → Escrow Release (Fuji) tx hash appears
7. **(Optional) LFJ swap** → Click "Swap USDC → AVAX on LFJ (testnet)" → LFJ Swap Tx (Fuji) hash appears under "Avalanche DeFi composability" section

### Key URLs
- **Frontend**: https://xramp-app.vercel.app
- **Orchestrator**: https://xramp-orchestrator.xramp.workers.dev
- **Explorer**: https://testnet.snowtrace.io

### Verifiable On-Chain Tx Hashes (per intent)
1. **Escrow Deposit (Fuji)** — `depositTxHash` → Snowtrace link
2. **Proof Hash** — payment proof from extension
3. **Escrow Release (Fuji)** — `releaseTxHash` → Snowtrace link
4. **LFJ Swap Tx (Fuji)** — `swapTxHash` → Snowtrace link (optional)

## References
- Peer.xyz / ZKP2P: https://docs.peer.xyz/ (future multi-LP quoting engine; current demo uses XRamp single LP)
- LFJ / Trader Joe: https://traderjoexyz.com/ (Avalanche DEX, V2.1 on Fuji testnet)
- ZKP2P Contracts: https://github.com/zkp2p/zkp2p-contracts
