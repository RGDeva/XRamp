# XRamp Quote Engine Report

**Date:** 2026-03-07 | **Mode:** Demo (fixed 1:1 rate, 0.5% fee)

---

## Buy-Side Quote Formula

```
receiveAmount = payAmount × (1 - 0.005)
             = payAmount × 0.995
```

**Example:** `$100 USD → 99.50 MockUSDC`

| File | Variable | Formula | Notes |
|---|---|---|---|
| `src/pages/Buy.tsx` | `receiveAmount` state | `num - (num * 0.005)` | `calculateReceive()` fn |
| `src/pages/Ramp.tsx` | `buyReceive` | `buyNum - buyNum * 0.005` | Fixed (was market price) |
| `src/components/shared/QuotesCard.tsx` | `netOut` | `num - (num * PROTOCOL_FEE)` | `PROTOCOL_FEE = 0.005` |
| `src/pages/BuyReview.tsx` | `receiveAmount` | nav state passthrough | `state.receiveAmount` |
| `src/pages/BuyComplete.tsx` | `receiveAmount` | nav state passthrough | `state.receiveAmount` |
| `xramp-extension/.../XRampBuy/index.tsx` | `receive` | `num - num * 0.005` | Fixed (was `num / price`) |

All buy-side surfaces now produce **identical output** for any given input.

---

## Sell-Side Quote Formula

```
receiveAmount = sellAmount × (1 - 0.01)
             = sellAmount × 0.99
```

**Example:** `100 MockUSDC → $99.00 USD`

| File | Variable | Formula | Notes |
|---|---|---|---|
| `src/pages/Sell.tsx` | `receiveAmount` state | `num - (num * 0.01)` | `calculateReceive()` fn |
| `src/pages/Ramp.tsx` | `sellReceive` | `sellNum * (1 - 0.01)` | Fixed (was market price) |
| `src/pages/SellReview.tsx` | `receiveAmount` | nav state passthrough | `state.receiveAmount` |
| `src/pages/SellComplete.tsx` | `receiveAmount` | nav state passthrough | `state.receiveAmount` |

---

## Rate Display Labels (post-fix)

| Screen | Label Shown |
|---|---|
| `Ramp.tsx` Buy tab | `Demo rate: 1 USD = 1 MockUSDC · Fee: $X.XX` |
| `Ramp.tsx` Sell tab | `Demo rate: 1 MockUSDC = 1 USD · 1% fee` |
| `Buy.tsx` | `Rate (demo) — 1 MockUSDC = $1.00 USD` |
| `Sell.tsx` | `Rate (demo) — 1 MockUSDC = $1.00 USD` |
| `QuotesCard.tsx` | `Rate (demo) — 1 USD = 1.00 MockUSDC` |
| `BuyReview.tsx` | `1 USD = 1 MockUSDC (hardcoded label)` |
| `SellReview.tsx` | `1 MockUSDC = $1.00 USD (hardcoded label)` |
| Extension XRampBuy | `Rate (demo) — 1 USD = 1 MockUSDC` |

---

## What Was Removed

### `TOKEN_PRICES` in `Ramp.tsx` (deleted)
```ts
// REMOVED — caused $1 → 0.035 AVAX on the Buy tab
const TOKEN_PRICES: Record<string, number> = {
  AVAX: 28.5, WAVAX: 28.5, ETH: 2650, WETH: 2650, SOL: 145,
  BASE: 2650, ARB: 0.92, USDC: 1, USDT: 1, 'BTC.b': 62000,
  BTC: 62000, JOE: 0.45, LINK: 14.5, AAVE: 92, GMX: 28,
};
```

### `TOKEN_PRICES` in Extension `XRampBuy/index.tsx` (deleted)
```ts
// REMOVED — caused $1 → 0.035 AVAX in extension quote panel
const TOKEN_PRICES: Record<string, number> = {
  AVAX: 28.5, USDC: 1, USDT: 1, ETH: 2650, 'BTC.b': 62000, SOL: 145,
};
```

---

## Fee Structure

| Flow | Fee | Applied to |
|---|---|---|
| Buy (ONRAMP) | 0.5% | Pay amount (USD) |
| Sell (OFFRAMP) | 1.0% | Sell amount (MockUSDC) |

Fees are computed entirely on the frontend for display. The orchestrator stores the raw `amount` only — it does not enforce fee logic on-chain. The escrow contract locks the exact `amount` passed at funding time.

---

## Activity Feed Quote Display

`Activity.tsx` shows `intent.amount` and `intent.sourceAsset → intent.targetAsset` from the orchestrator. It does **not** recompute receive amounts — it only displays what was stored at intent creation. This means the activity view shows:

```
Buy · 100 USD → USDC
Sell · 100 USDC → USD
```

The receive amount (post-fee) is not stored in the intent record and is not shown in Activity. This is by design for this demo — the full details are in BuyComplete / SellComplete screens.
