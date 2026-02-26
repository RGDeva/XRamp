---
name: deva
description: XRamp project skill — invoke when working on XRamp features, pages, components, or flows. Provides architecture map, conventions, key file locations, and development patterns for the XRamp crypto on/off-ramp app.
---

# XRamp Project Skill

## Project Overview
XRamp is a **React + TypeScript + Vite** crypto on/off-ramp web app. Users can Buy, Sell, and Send crypto via peer-to-peer payment rails (Venmo, Cash App, Zelle, etc.). It uses **Privy** for wallet/auth, **Tailwind CSS + shadcn/ui** for UI, and a custom **orchestratorApi** for intent management.

- **Repo**: `RGDeva/XRamp` on GitHub — `main` branch auto-deploys to Vercel
- **Deploy**: Vercel at `https://xramp-app.vercel.app`
- **Package manager**: npm with `--legacy-peer-deps`

---

## Architecture & Key Files

### Pages (`src/pages/`)
| File | Route | Purpose |
|------|-------|---------|
| `Home.tsx` | `/` | Dashboard with Buy/Sell buttons → `/ramp?tab=Buy|Sell` |
| `Ramp.tsx` | `/ramp` | **Main page** — 3-tab (Buy / Sell / Send) full forms |
| `Buy.tsx` | `/buy` | Standalone buy flow (also replicated in Ramp Buy tab) |
| `Sell.tsx` | `/sell` | Standalone sell flow (also replicated in Ramp Sell tab) |
| `BuyReview.tsx` | `/buy/review` | Review intent before confirming buy |
| `BuyComplete.tsx` | `/buy/complete` | Buy success screen |
| `SellReview.tsx` | `/sell/review` | Review intent before confirming sell |
| `SellComplete.tsx` | `/sell/complete` | Sell success screen |
| `Activity.tsx` | `/activity` | Intent history list |

### Shared Components (`src/components/shared/`)
| File | Purpose |
|------|---------|
| `CryptoIcon.tsx` | `CryptoIcon` component + `TOKENS` array (15 tokens, Avalanche-first) + `ICON_URLS` |
| `PaymentMethodPicker.tsx` | Modal for selecting payment/payout rails; exports `getPaymentMethodById` |
| `RailIcon.tsx` | Icon for payment rails (venmo, cashapp, zelle, etc.) |
| `QuotesCard.tsx` | Shows best LP quote given amount + crypto |
| `TokenSelectorModal.tsx` | Token search/select modal (used in Buy/Sell standalone pages) |

### UI Components (`src/components/ui/`)
- `kinetic-dots-loader.tsx` — **KineticDotsLoader** — use `dots={3}` inline, `dots={4}` full-page
- `interactive-hover-button.tsx` — primary CTA button throughout
- `glowing-effect.tsx`, `animated-gradient-text.tsx`, `word-rotate.tsx` — hero animations

### Contexts (`src/contexts/`)
| File | Hook | Key exports |
|------|------|-------------|
| `AuthContext.tsx` | `useAuth()` | `isAuthenticated`, `isLoading`, `user`, `login`, `logout` |
| `AppContext.tsx` | `useApp()` | `selectedCurrency`, `selectedCrypto`, `privacyMode`, `rampPanelOpen` |

### API (`src/lib/`)
- `orchestratorApi.ts` — `createOnrampIntent`, `createOfframpIntent`, `listIntents`, `getIntent`

---

## Critical Conventions

### Payment Handle Input Pattern
All Buy/Sell forms that select a **non-bank** payment rail must show a handle input field. The `HANDLE_META` dict drives this:
```ts
const HANDLE_META = {
  venmo:   { label: 'Venmo username',         placeholder: 'yourname',    prefix: '@' },
  cashapp: { label: 'Cash Tag',               placeholder: 'yourcashtag', prefix: '$' },
  chime:   { label: 'ChimeSign',              placeholder: 'yourname',    prefix: '@' },
  zelle:   { label: 'Zelle email or phone',   placeholder: 'you@email.com' },
  revolut: { label: 'Revolut tag',            placeholder: 'yourname',    prefix: '@' },
  wise:    { label: 'Wise username',          placeholder: 'yourname',    prefix: '@' },
  paypal:  { label: 'PayPal email / @username', placeholder: 'you@email.com' },
  // bank → no handle input
};
```
- `requiresHandle = !!method && method !== 'bank'`
- Handle must be passed through navigation state to Review and Complete pages
- Reset handle to `''` whenever the method changes

### Token System
- `TOKENS` in `CryptoIcon.tsx` is the canonical token list — **15 tokens**, Avalanche C-Chain first
- Token objects: `{ symbol, name, network, chain, address? }`
- Icons via CoinGecko CDN in `ICON_URLS` — key is `symbol.toLowerCase()`
- Default token: `TOKENS[0]` = AVAX

### Loading States
Always use `KineticDotsLoader` for loading — never raw CSS spinners or text:
- Full-page: `<KineticDotsLoader dots={4} />` centered
- Inline (above button): `<KineticDotsLoader dots={3} className="py-0" />`

### Navigation State Pattern
State is passed between pages via React Router `navigate('/path', { state: {...} })` and read with `useLocation().state`.

Buy flow state keys: `payAmount`, `receiveAmount`, `paymentMethod`, `paymentHandle`, `currency`, `crypto`, `intentId`
Sell flow state keys: `sellAmount`, `receiveAmount`, `payoutMethod`, `payoutHandle`, `currency`, `crypto`, `intentId`

### Auth Pattern
```ts
const { isAuthenticated, isLoading, user, login } = useAuth();
const getUserId = () => user?.email || user?.walletAddress || user?.embeddedWalletAddress || 'guest';
```
- Always guard continue actions with `if (!isAuthenticated) { login(); return; }`
- Show `KineticDotsLoader` while `isLoading`

### Tab Routing on /ramp
Tabs are driven by URL search param: `/ramp?tab=Buy`, `/ramp?tab=Sell`, `/ramp?tab=Send`
```ts
const [searchParams] = useSearchParams();
const rawTab = searchParams.get('tab') ?? '';
const tab = (['Buy','Sell','Send'].includes(rawTab) ? rawTab : 'Buy') as RampTab;
```

---

## Development Commands
```bash
npm run dev      # Start dev server (Vite, port 5173)
npm run build    # Production build
npx tsc --noEmit # Type-check only (run before every commit)
```

## Commit & Deploy
```bash
npx tsc --noEmit                        # must be clean
git add -A && git commit -m "message"
git push origin main                    # triggers Vercel auto-deploy
```
