import { ArrowDownToLine, Clock, Layers } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { TrustwareDepositWidget } from '@/components/shared/TrustwareDepositWidget';

export default function Deposits() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 pb-32 md:pb-12 max-w-3xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
        <p className="text-sm text-muted-foreground mt-1">Fund your position with any token from any chain.</p>
      </div>

      {/* Trustware cross-chain deposit section */}
      <div className="relative bg-card border border-border rounded-2xl p-5 space-y-4">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />

        {/* Section header */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Layers className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Cross-Chain Deposit</p>
            <p className="text-xs text-muted-foreground">Powered by Trustware — bridge any token, arrive as AVAX on Avalanche</p>
          </div>
        </div>

        {/* How it works */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
          <ArrowDownToLine className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Select any source token on any supported chain. Trustware automatically routes and converts it to AVAX on Avalanche — no manual bridging required.
          </p>
        </div>

        {/* Widget */}
        <TrustwareDepositWidget />
      </div>

      {/* LP Deposits — coming soon */}
      <div className="relative bg-card border border-border rounded-2xl p-5">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Fiat LP Deposits — Coming Soon</p>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Deposit USDC liquidity and accept fiat off-ramp orders
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Order matching against buyer intents across Venmo, Cash App, Zelle
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Earnings tracking, fill rate analytics, and deposit management
          </li>
        </ul>
      </div>
    </div>
  );
}
