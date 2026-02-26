# XRamp — Cascade Agent Instructions

Global conventions Cascade must follow when working anywhere in this repository.

---

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Auth/Wallet**: Privy (`@privy-io/react-auth`)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **HTTP/API**: Custom `orchestratorApi` in `src/lib/orchestratorApi.ts`
- **Deploy**: Vercel (auto-deploys from `main` branch)

---

## Code Conventions

### TypeScript
- Always run `npx tsc --noEmit` before committing — zero type errors required
- Use explicit types on function signatures and state; avoid `any`
- Prefer `interface` for object shapes, `type` for unions/aliases

### React
- Functional components only — no class components
- Hooks at the top of components, in consistent order: context → state → derived values → callbacks → effects
- Derived values (computed from state) are plain `const`, not `useMemo`, unless the computation is expensive
- Default exports for pages, named exports for components/utilities

### Imports
- All imports at the top of the file — never mid-file
- Use `@/` path alias for `src/` — e.g. `import { cn } from '@/lib/utils'`
- Group: external libs → internal contexts/lib → components → types

### Styling
- Tailwind utility classes only — no inline `style={{}}` except for animations
- Use `cn()` from `@/lib/utils` for conditional class merging
- Dark-mode-first: use semantic tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`)
- Rounded: `rounded-xl` for cards/inputs, `rounded-2xl` for larger containers
- Spacing: `p-4` / `gap-4` as base unit

---

## UI Patterns

### Loading States
**Always** use `KineticDotsLoader` — never raw CSS spinners or loading text:
```tsx
import KineticDotsLoader from '@/components/ui/kinetic-dots-loader';

// Full-page (auth init, page-level fetch)
<KineticDotsLoader dots={4} />

// Inline above a submit button
{isSubmitting && <KineticDotsLoader dots={3} className="py-0" />}
```

### Primary CTA Button
```tsx
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

<InteractiveHoverButton
  text={isSubmitting ? 'Processing…' : 'Continue'}
  onClick={handleSubmit}
  disabled={isSubmitting || !canContinue}
  className="w-full h-12 text-base rounded-xl border-primary/40 text-foreground"
/>
```

### Error Display
```tsx
import { AlertCircle } from 'lucide-react';

{error && (
  <div className="flex items-center gap-2 text-xs text-destructive">
    <AlertCircle className="h-3.5 w-3.5" />
    <span>{error}</span>
  </div>
)}
```

---

## Auth Pattern
```ts
const { isAuthenticated, isLoading, user, login } = useAuth();
const getUserId = () =>
  user?.email || user?.walletAddress || user?.embeddedWalletAddress || 'guest';

// Guard any authenticated action:
if (!isAuthenticated) { login(); return; }
```
- Show `KineticDotsLoader` while `isLoading === true`
- Never hardcode user IDs — always use `getUserId()`

---

## Navigation State Pattern
Pages pass data to each other via React Router state — never URL params for sensitive values:
```ts
navigate('/buy/review', { state: { payAmount, receiveAmount, paymentMethod, paymentHandle, currency, crypto, intentId } });
// Read it:
const state = useLocation().state as BuyReviewState;
```

**Buy flow keys**: `payAmount`, `receiveAmount`, `paymentMethod`, `paymentHandle`, `currency`, `crypto`, `intentId`
**Sell flow keys**: `sellAmount`, `receiveAmount`, `payoutMethod`, `payoutHandle`, `currency`, `crypto`, `intentId`

---

## Payment Handle Rules
Any Buy or Sell form using a **non-bank** rail must show a handle input. Bank transfers have no handle.
- `venmo` → `@username`, `cashapp` → `$cashtag`, `chime` → `@username`
- `revolut` → `@tag`, `wise` → `@username`, `zelle` → email/phone, `paypal` → email/@
- Reset handle to `''` when the payment method changes
- Pass handle in navigation state to Review and Complete pages

---

## File Locations Quick Reference
```
src/
  pages/          — Route-level page components
  components/
    shared/       — CryptoIcon, PaymentMethodPicker, RailIcon, QuotesCard
    ui/           — shadcn + custom UI primitives
    layout/       — TopNav, shell layout
    deposits/     — SendSheet and deposit flow
  contexts/       — AuthContext, AppContext
  lib/            — orchestratorApi, utils
  assets/         — static images/logos
```

---

## Commit & Deploy
```bash
npx tsc --noEmit                     # must pass with 0 errors
git add -A
git commit -m "concise imperative message"
git push origin main                 # Vercel auto-deploys
```
