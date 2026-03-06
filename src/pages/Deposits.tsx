import { Target, Clock } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { RailIcon } from '@/components/shared/RailIcon';

const SUPPORTED_RAILS = [
  { id: 'venmo', name: 'Venmo' },
  { id: 'cashapp', name: 'Cash App' },
  { id: 'zelle', name: 'Zelle' },
  { id: 'revolut', name: 'Revolut' },
  { id: 'wise', name: 'Wise' },
];

export default function Deposits() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 pb-32 md:pb-12 max-w-3xl mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
        <p className="text-sm text-muted-foreground mt-1">USDC liquidity deposits for fiat off-ramp orders.</p>
      </div>

      {/* Supported rails */}
      <div className="flex items-center gap-3 mb-6">
        {SUPPORTED_RAILS.map(({ id, name }) => (
          <div key={id} className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden shadow-sm" title={name}>
            <RailIcon rail={id} size={26} />
          </div>
        ))}
      </div>

      {/* Honest empty state */}
      <div className="relative bg-card border border-border rounded-2xl p-10 text-center">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <Target className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground mb-2">LP Deposits — Coming Soon</p>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          The LP deposit system is not yet implemented. When available, liquidity providers will be able to deposit USDC and accept fiat off-ramp orders via supported payment rails.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Currently, escrow funding is handled by the arbiter wallet during the demo flow.</span>
        </div>
      </div>

      {/* What will be here */}
      <div className="mt-6 relative bg-card border border-border rounded-2xl p-5">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <p className="text-sm font-medium text-foreground mb-3">Planned features</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Create USDC liquidity deposits with configurable rate and payment rail
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Order matching against buyer intents
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Earnings tracking, fill rate analytics, and deposit management
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Multi-rail support: Venmo, Cash App, Zelle, Revolut, Wise
          </li>
        </ul>
      </div>
    </div>
  );
}
