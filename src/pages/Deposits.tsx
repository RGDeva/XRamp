import { ArrowDownToLine, Clock, Layers, Zap } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { TrustwareDepositWidget } from '@/components/shared/TrustwareDepositWidget';

export default function Deposits() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 pb-32 md:pb-12 max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
        <p className="text-sm text-muted-foreground">
          Two ways to put capital into XRamp — fiat via Venmo proof, or crypto from any chain via Trustware.
        </p>
      </div>

      {/* Rail comparison pills */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border">
          <Zap className="h-4 w-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">Fiat Rail</p>
            <p className="text-[11px] text-muted-foreground">Venmo → proof → AVAX</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
          <Layers className="h-4 w-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">Crypto Rail</p>
            <p className="text-[11px] text-muted-foreground">Any chain → AVAX</p>
          </div>
        </div>
      </div>

      {/* Trustware cross-chain deposit section */}
      <div className="relative bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
        <GlowingEffect spread={48} glow disabled={false} proximity={80} inactiveZone={0.01} borderWidth={2} />

        {/* Section header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Cross-Chain Deposit</p>
              <p className="text-xs text-muted-foreground mt-0.5">Powered by Trustware — any token, any chain → AVAX on Avalanche</p>
            </div>
          </div>

          {/* How it works callout */}
          <div className="flex items-start gap-2 mt-4 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
            <ArrowDownToLine className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Select a source token from Ethereum, Base, Arbitrum, or other supported chains.
              Trustware routes and converts it — no manual bridging or token swaps required.
            </p>
          </div>
        </div>

        {/* Widget */}
        <div className="p-5">
          <TrustwareDepositWidget />
        </div>
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
            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            Deposit USDC and accept fiat off-ramp orders as a liquidity provider
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            Order matching against buyer intents across Venmo, Cash App, Zelle
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            Earnings tracking, fill rate analytics, deposit management
          </li>
        </ul>
      </div>
    </div>
  );
}
