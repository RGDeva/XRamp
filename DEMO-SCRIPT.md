# XRamp Demo Scripts — Hackathon Final

## Truth Table

| Step | What happens | Real? | Who signs | Token | Chain |
|---|---|---|---|---|---|
| **Intent creation** | Stored in D1 database, JWT-authenticated | ✅ Real | N/A (API call) | — | — |
| **Escrow funding (Buy)** | Backend arbiter mints MockUSDC, creates escrow, deposits on-chain | ✅ Real Fuji tx | Backend LP wallet | MockUSDC (`0xb2F4…`) | Avalanche Fuji |
| **Escrow funding (Sell)** | User's Privy wallet signs: mint → createEscrow → approve → deposit | ✅ Real Fuji tx | User wallet (popup) | MockUSDC (`0xb2F4…`) | Avalanche Fuji |
| **Venmo payment** | User pays via Venmo outside the app | ✅ Real fiat payment | N/A | Fiat USD | — |
| **Proof submission** | XRamp extension captures proof, submits proofHash to orchestrator | ✅ Real | N/A (extension) | — | — |
| **Admin verify + release** | Arbiter calls releaseEscrow() on Fuji, MockUSDC released | ✅ Real Fuji tx | Backend arbiter | MockUSDC (`0xb2F4…`) | Avalanche Fuji |
| **LFJ swap** | Arbiter mints LFJ testnet USDC, swaps USDC→AVAX via LBRouter V2.1 | ✅ Real Fuji tx | Backend arbiter | LFJ USDC (`0xB607…`) | Avalanche Fuji |
| **Rate (demo)** | Fixed 1:1 USD = MockUSDC, labeled "(demo)" in UI | ⚠️ Demo rate | — | — | — |
| **Fees (demo)** | 0.5% buy, 1% sell, labeled "(demo)" in UI | ⚠️ Demo rate | — | — | — |

### LFJ Honest Framing

> **The LFJ swap is NOT directly downstream of the escrow release.** The escrow uses MockUSDC (`0xb2F4…`) and LFJ uses its own testnet USDC (`0xB607…`). These are different tokens on Fuji testnet.
>
> **On Avalanche mainnet, both would be the same real USDC token**, making the flow a true single-asset pipeline: escrow release → LFJ swap.
>
> **Correct framing:** "Avalanche DeFi composability demo" — we demonstrate that after settlement, funds can be immediately composed into Avalanche DeFi (LFJ/Trader Joe) with a real on-chain swap. The testnet token difference is a testnet-only limitation.

---

## Demo Script A: Core Flow (60 seconds)

**Narration:** "XRamp is a fiat-to-crypto onramp that uses Venmo payment proofs to settle on Avalanche through an escrow contract."

### Steps

1. **Open app** → `https://xramp-app.vercel.app`
   - Log in with Privy (email or wallet)

2. **Click Buy tab** → enter `$25`, select `USDC`, select `Venmo`
   - **Point at:** QuotesCard showing "Escrow Quote" with "Fuji testnet" badge
   - **Say:** "We quote 1:1 for demo. The settlement happens on Avalanche Fuji with MockUSDC."

3. **Click Continue** → Review page appears
   - **Point at:** "XRamp LP funds escrow" notice
   - **Point at:** "Settlement: Avalanche Fuji · MockUSDC" label
   - **Say:** "The XRamp liquidity provider funds the on-chain escrow. No wallet signature needed from the buyer."

4. **Click Confirm buy** → Loading: "XRamp LP funding escrow on Fuji…" → Complete page
   - **Point at:** "Escrow funded by XRamp LP" title
   - **Point at:** "Avalanche Fuji testnet · MockUSDC" badge
   - **Point at:** "Escrow Deposit (Fuji)" tx hash → click to open Snowtrace
   - **Say:** "That's a real transaction on Avalanche Fuji. The escrow contract now holds MockUSDC."

5. **Open XRamp extension** → Click the intent → Submit proof
   - **Say:** "The extension captures the Venmo payment proof and submits a proof hash to the orchestrator."

6. **Go to Activity** → Click the intent → See detail sheet
   - **Point at:** "Escrow Deposit (Fuji)" — Snowtrace link
   - **Point at:** "Proof Hash" — with verified/pending badge
   - **Say:** "Every step has a verifiable on-chain receipt."

7. **Click "Verify + Release Escrow"** (admin action)
   - **Point at:** "Escrow Release (Fuji)" tx hash that appears
   - **Say:** "Admin verifies the proof and releases MockUSDC from escrow. That's another real Avalanche transaction."

**Closing:** "Venmo payment in, proof verified, USDC released on Avalanche. Every step has a transaction hash you can verify on Snowtrace."

---

## Demo Script B: Enhanced Flow with LFJ (90 seconds)

**Do everything in Script A first, then continue:**

8. **After escrow release, in Activity detail** → scroll to "Avalanche DeFi composability" section
   - **Say:** "Once settlement is complete, we can immediately compose into Avalanche DeFi."

9. **Click "Swap USDC → AVAX on LFJ (testnet)"**
   - Loading: "Swapping on LFJ…"
   - **Point at:** "LFJ Swap Tx (Fuji)" hash that appears → click to open Snowtrace
   - **Point at:** "USDC → AVAX (testnet)" badge
   - **Point at:** "LFJ (Trader Joe) V2.1" DEX label

10. **Say:** "This is a real swap on LFJ — Trader Joe's DEX on Avalanche Fuji. After settlement, the user's funds can be immediately composed into any Avalanche DeFi protocol. On mainnet, this would be the same USDC flowing directly from escrow into Trader Joe."

**Closing:** "Fiat in via Venmo, settled on Avalanche, and composed into DeFi — all with verifiable on-chain transactions."

---

## Key Labels Judges Will See

| Screen | Label | Meaning |
|---|---|---|
| QuotesCard | `Fuji testnet` badge | Settlement network |
| BuyReview | `Settlement: Avalanche Fuji · MockUSDC` | Chain + token |
| BuyReview | `XRamp LP funds escrow` | Who pays |
| SellReview | `Your wallet will sign` | User signs |
| BuyComplete | `Escrow funded by XRamp LP` | Funding source |
| BuyComplete | `Avalanche Fuji testnet · MockUSDC` badge | Chain + token |
| BuyComplete | `Escrow Deposit (Fuji)` + Snowtrace link | Real tx |
| Activity detail | `Escrow Deposit (Fuji)` | depositTxHash |
| Activity detail | `Proof Hash` + verified badge | proofHash |
| Activity detail | `Escrow Release (Fuji)` | releaseTxHash |
| Activity detail | `Avalanche DeFi composability` section header | LFJ section |
| Activity detail | `LFJ Swap Tx (Fuji)` + Snowtrace link | swapTxHash |
| Activity detail | `USDC → AVAX (testnet)` badge | Swap pair |
| Activity detail | `LFJ (Trader Joe) V2.1` | DEX name |

## Tx Hashes to Point At (per intent)

1. **depositTxHash** — "Escrow Deposit (Fuji)" → Snowtrace link
2. **proofHash** — "Proof Hash" → verified/pending badge
3. **releaseTxHash** — "Escrow Release (Fuji)" → Snowtrace link
4. **swapTxHash** — "LFJ Swap Tx (Fuji)" → Snowtrace link (enhanced demo only)
