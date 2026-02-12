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

## Editing the app

### Option 1: Use Lovable
Open the project in Lovable and prompt changes:
(https://xramp.lovable.app/)

Changes made in Lovable are committed automatically to this repo.

### Option 2: Work locally
Requirements: Node.js + npm (nvm recommended)


Peer/ZkP2P Documentation - https://docs.peer.xyz/
Trustware SDK Documentation - https://www.notion.so/trustware/Deposit-Widget-28671aae45df80c7b7bbeae1ff38848e
https://github.com/zkp2p/zkp2p-contracts
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
