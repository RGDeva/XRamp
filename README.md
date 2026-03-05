# XRamp

XRamp is an embedded crypto rails product that makes it easy to move between fiat and onchain assets in minutes.

At a high level, XRamp orchestrates:
- P2P onramp/offramp coordination (Peer / ZKP2P style flows)
- Escrow-style safety guarantees (lock → confirm → release)
- A universal swap layer (Trustware) to route USDC into any token
- Optional privacy and shielded-transfer layers (future)
- A distribution surface via web embed + Chrome extension (future)

This repo contains the XRamp frontend built in Lovable and designed to stay minimal, fast, and easy to embed.

## Product direction

### Current focus (v0)
- Clean 4-step flow: Amount → Funding → Swap → Withdraw
- Intent + status tracking UI (funding, swapping, withdrawing)
- Receipt view for users (timeline + tx refs)
- Basic admin/debug surfaces (dev only)

### Planned integrations
- **Peer / ZKP2P**: onramp and offramp coordination (fiat methods like Venmo, Cash App, Revolut, bank transfer)
- **Trustware**: universal swaps and routing (USDC → target token)
- **Escrow + verification**: automated lock/confirm/release lifecycle via orchestration + webhooks
- **Veil.cash or similar** (optional): privacy mode and shielded transfers (phase 2)

### Future surfaces
- **Chrome extension**: “XRamp anywhere” onramp/offramp/swap overlay
- **Embedded SDK**: drop-in widget for partners
- **Partner API**: create funding/swap/withdraw intents programmatically

## To-do (near-term)
- [ ] Decide v0 chain + stablecoin scope (recommend: single chain + USDC only)
- [ ] Define escrow model and verification rules per payment method
- [ ] Implement intent-based state machine and status UI
- [ ] Add webhook listeners for Peer and Trustware events
- [ ] Add receipt export (JSON + human-readable)
- [ ] Add basic admin view (intent list + detail + logs)
- [ ] Spike Chrome extension architecture and onboarding flow

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

### Prerequisites
- Orchestrator running (local or deployed)
- Privy account logged in
- (For on-chain demo) Contracts deployed to Fuji, addresses in `fujiConfig.json`

### Demo Flow

1. **Open XRamp** → `https://xramp-app.vercel.app` or `localhost:5173`
2. **Log in** → Click "Get Started" → Privy login (email or wallet)
3. **Home page** → Shows delivery address, real ERC20 balance (if contracts deployed), recent activity from backend
4. **Buy crypto**:
   - Click "Buy" → Enter amount (e.g. `100`) → Select payment method (e.g. Venmo) → Enter handle (`@username`)
   - Click "Continue" → Creates real intent in backend (state: `CREATED`)
   - Review page shows intent details → Confirm
   - Complete page shows order received
5. **View Activity** → Click "View activity" or navigate to Activity tab
   - Shows all intents from backend with real states
   - Click any intent → Detail sheet shows Intent ID, state, rail, handle, tx hashes
6. **Admin Verify + Release** (admin email: `rishig@umich.edu`):
   - Open an intent detail → "Verify + Release Escrow" button appears for admin
   - Click → Backend marks proofs verified, releases escrow on Fuji (if deployed), transitions to `COMPLETE`
   - Release tx hash appears with Snowtrace explorer link
7. **Sell crypto** → Same flow as Buy but creates OFFRAMP intent
8. **Chrome Extension** → Open side panel → Same Buy/Sell/Send flows, all dropdowns working

### Key URLs
- **Frontend**: https://xramp-app.vercel.app
- **Explorer**: https://testnet.snowtrace.io
- **Orchestrator health**: `GET /health`

### Verifiable On-Chain Artifacts
- MockUSDC contract address → check `contracts/deployed.json`
- XRampEscrow contract address → check `contracts/deployed.json`
- Deposit tx hashes → visible in Activity detail sheet → clickable Snowtrace links
- Release tx hashes → visible after admin verify

## References
- Peer/ZkP2P Documentation: https://docs.peer.xyz/
- Trustware SDK: https://www.notion.so/trustware/Deposit-Widget-28671aae45df80c7b7bbeae1ff38848e
- ZKP2P Contracts: https://github.com/zkp2p/zkp2p-contracts
