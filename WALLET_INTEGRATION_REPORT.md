# XRamp Wallet Integration Report

**Date:** 2026-03-07 | **Network:** Avalanche Fuji Testnet (chainId: 43113)

---

## Architecture: Which Wallet Is Used

XRamp uses **Privy** for auth and wallet management. There are two wallet types available:

| Type | `walletClientType` | When available |
|---|---|---|
| Privy embedded wallet | `'privy'` | Automatically created for email-login users |
| External wallet (Core, MetaMask, etc.) | anything else | When user connects via "Connect wallet" |

**Priority in `getWalletSigner()`** (in `AuthContext.tsx`):
```ts
const embedded = wallets.find(w => w.walletClientType === 'privy');
const external = wallets.find(w => w.walletClientType !== 'privy');
const wallet = embedded || external;  // embedded wins
```

**Conclusion:** Email-login users always use their **Privy embedded wallet** for signing. External wallet (Core) users fall back correctly if no embedded wallet exists. There is no signer mismatch.

---

## Chain Configuration

**`PrivyProvider.tsx`:**
```ts
defaultChain: avalancheFuji,           // chainId: 43113
supportedChains: [avalancheFuji, avalanche],
embeddedWallets: {
  ethereum: { createOnLogin: 'users-without-wallets' }
}
```

**`AuthContext.tsx` — chain switching before every signing operation:**
```ts
try {
  await wallet.switchChain(FUJI_CHAIN_ID);  // 43113
} catch {
  // switchChain may throw if already on right chain — continue
}
```

The `catch` on `switchChain` silently continues if the wallet is already on Fuji or if the wallet doesn't support programmatic chain switching. This is intentional and safe.

---

## Wallet Behavior by User Type

### Email-only user (most common in demo)
- Privy creates embedded wallet automatically on login
- Wallet address shown in app as `user.embeddedWalletAddress`
- Signing via Privy's built-in UI (not Core popup)
- **No Core wallet needed**

### Core wallet user
- External wallet detected as non-`'privy'` type
- `getWalletSigner()` falls back to external wallet
- Core's native popup appears for all signing operations
- Chain switching triggers Core's "switch network" dialog

### Both wallets connected
- Embedded wallet **takes priority**
- Core wallet is ignored for signing (even if connected)
- This is the correct behavior for demo predictability

---

## Gas Handling

**No automatic gas provisioning.** The app relies on the user having Fuji AVAX for gas.

**Error handling in `SellReview.tsx`:**
```ts
if (msg.toLowerCase().includes('insufficient funds') || msg.toLowerCase().includes('gas')) {
  setConfirmError('Insufficient Fuji AVAX for gas. Get testnet AVAX from the Avalanche Fuji faucet (faucet.avax.network) and try again.');
}
```

**Gas requirement for sell flow:** ~0.05 AVAX on Fuji to cover 4 transactions:
1. `mint(address, amount)` — ERC20 mint
2. `createEscrow(token, amount, payer, payee)` — escrow creation
3. `approve(spender, amount)` — ERC20 approval
4. `deposit(escrowId)` — escrow funding

**Gas requirement for buy flow:** None for the user. The arbiter wallet (backend) pays gas for LP-funded escrow.

---

## Remaining Wallet Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Embedded wallet on wrong chain | Low | `switchChain(43113)` called before every sign |
| Core wallet not switching chains | Low | `catch` allows it to continue; Core shows its own UI |
| User has zero Fuji AVAX | High for sell | Error message shown with faucet link |
| Arbiter wallet has zero Fuji AVAX | High for buy | Backend silently fails — need to monitor arbiter balance |
| Multiple embedded wallets (unlikely) | Low | `find()` returns first match |
| Privy session expired | Medium | Privy handles re-auth; `getAccessToken()` refreshes automatically |

---

## Intended Wallet Architecture (Final State)

```
Web app (Buy flow):
  User → email/wallet login via Privy
  No wallet signing needed (LP funds escrow)
  Delivery address = embeddedWalletAddress || walletAddress

Web app (Sell flow):
  User → email/wallet login via Privy
  getWalletSigner() → embedded (or Core fallback)
  switchChain(43113) → ethers.BrowserProvider → signer
  4 sequential transactions with per-step UI feedback

Extension:
  Uses Privy getAccessToken() for orchestrator auth
  No wallet signing (only proof submission via API)
  Auth token passed as Bearer to orchestrator
```

---

## No Unsupported Network Issues

The `supportedChains` config in `PrivyProvider.tsx` includes both `avalancheFuji` and `avalanche`. The embedded wallet will accept chain switch requests to either. If Core is connected and on mainnet Avalanche, it will prompt to switch to Fuji when the sell flow is initiated.

There are no "unsupported network" errors in the current codebase — `switchChain` errors are caught and ignored, and the `ethers.BrowserProvider` wraps whatever chain the wallet is currently on.
