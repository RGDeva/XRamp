import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, ExternalLink, ChevronRight } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { RailIcon } from '@/components/shared/RailIcon';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import { cn } from '@/lib/utils';

/* ── Mock LP deposit positions ────────────────────── */

interface DepositPosition {
  id: number;
  remaining: string;
  locked: string;
  taken: string;
  platform: string;
  currency: string;
  status: 'Active' | 'Depleted' | 'Withdrawn';
  depositor: string;
  escrow: string;
  createdAt: string;
  depositedAmount: string;
  withdrawnAmount: string;
  orders: Order[];
}

interface Order {
  buyer: string;
  releaseAmount: string;
  receiveAmount: string;
  platform: string;
  status: 'Completed' | 'Pending' | 'Expired';
  updatedAt: string;
}

const MOCK_DEPOSITS: DepositPosition[] = [
  {
    id: 2428,
    remaining: '6.69',
    locked: '—',
    taken: '6.69',
    platform: 'venmo',
    currency: 'USD',
    status: 'Active',
    depositor: '0x01141553f506df71cb71751a30526f00269179ac',
    escrow: '0x8f3e…a91c',
    createdAt: '2025-03-09T10:23:00Z',
    depositedAmount: '13.38',
    withdrawnAmount: '0.00',
    orders: [
      { buyer: '0xd4F1…79ec', releaseAmount: '3.35 USDC', receiveAmount: '$3.35', platform: 'venmo', status: 'Completed', updatedAt: '12 min ago' },
      { buyer: '0xaB23…c1f0', releaseAmount: '3.34 USDC', receiveAmount: '$3.34', platform: 'venmo', status: 'Completed', updatedAt: '28 min ago' },
    ],
  },
  {
    id: 2441,
    remaining: '18.69',
    locked: '—',
    taken: '18.69',
    platform: 'cashapp',
    currency: 'USD',
    status: 'Active',
    depositor: '0x01141553f506df71cb71751a30526f00269179ac',
    escrow: '0x2b7a…de44',
    createdAt: '2025-03-09T09:02:00Z',
    depositedAmount: '25.00',
    withdrawnAmount: '0.00',
    orders: [
      { buyer: '0x7cE9…88b3', releaseAmount: '18.69 USDC', receiveAmount: '$18.69', platform: 'cashapp', status: 'Completed', updatedAt: '1 hr ago' },
    ],
  },
  {
    id: 2455,
    remaining: '0.00',
    locked: '—',
    taken: '50.00',
    platform: 'venmo',
    currency: 'USD',
    status: 'Depleted',
    depositor: '0x01141553f506df71cb71751a30526f00269179ac',
    escrow: '0xf1c2…7d09',
    createdAt: '2025-03-08T15:30:00Z',
    depositedAmount: '50.00',
    withdrawnAmount: '0.00',
    orders: [
      { buyer: '0x33aB…f921', releaseAmount: '25.00 USDC', receiveAmount: '$25.00', platform: 'venmo', status: 'Completed', updatedAt: '3 hrs ago' },
      { buyer: '0x91dE…44c7', releaseAmount: '25.00 USDC', receiveAmount: '$25.00', platform: 'venmo', status: 'Completed', updatedAt: '5 hrs ago' },
    ],
  },
];

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-success/10 text-success border-success/20',
  Depleted: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Withdrawn: 'bg-muted text-muted-foreground border-border',
  Completed: 'text-success',
  Pending: 'text-amber-500',
  Expired: 'text-muted-foreground',
};

/* ── Deposit Detail View ──────────────────────────── */

function DepositDetail({ deposit, onBack }: { deposit: DepositPosition; onBack: () => void }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to deposits
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Deposit #{deposit.id}</h2>
        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', STATUS_STYLES[deposit.status])}>
          {deposit.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left — Summary */}
        <div className="relative bg-card border border-border rounded-2xl p-5 space-y-4">
          <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Deposit Summary</p>

          <div className="space-y-3 text-sm">
            {([
              ['Deposited', `${deposit.depositedAmount} USDC`],
              ['Available', `${deposit.remaining} USDC`],
              ['Locked', deposit.locked],
              ['Taken', `${deposit.taken} USDC`],
              ['Withdrawn', `${deposit.withdrawnAmount} USDC`],
            ] as const).map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{val}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Depositor</span>
              <span className="font-mono text-xs text-foreground">{deposit.depositor.slice(0, 6)}…{deposit.depositor.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Escrow</span>
              <span className="font-mono text-xs text-foreground">{deposit.escrow}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="text-foreground">{new Date(deposit.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Platforms</p>
            <div className="flex items-center gap-2">
              <RailIcon rail={deposit.platform} size={20} />
              <span className="text-sm text-foreground capitalize">{deposit.platform}</span>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', STATUS_STYLES[deposit.status])}>
                {deposit.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right — Orders */}
        <div className="relative bg-card border border-border rounded-2xl p-5 space-y-4">
          <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Orders</p>

          {deposit.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-5 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2">
                <span>Buyer</span>
                <span>Release</span>
                <span>Receive</span>
                <span>Platform</span>
                <span>Status</span>
              </div>
              {deposit.orders.map((o, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center px-2 py-2.5 rounded-xl bg-secondary/50 text-sm">
                  <span className="font-mono text-xs truncate">{o.buyer}</span>
                  <span className="font-medium">{o.releaseAmount}</span>
                  <span className="text-muted-foreground">{o.receiveAmount}</span>
                  <RailIcon rail={o.platform} size={16} />
                  <span className={cn('text-xs font-medium', STATUS_STYLES[o.status])}>{o.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Deposits Page ────────────────────────────────── */

export default function Deposits() {
  const navigate = useNavigate();
  const [selectedDeposit, setSelectedDeposit] = useState<DepositPosition | null>(null);

  if (selectedDeposit) {
    return (
      <div className="min-h-[calc(100vh-4rem)] px-4 py-8 pb-32 md:pb-12 max-w-5xl mx-auto">
        <DepositDetail deposit={selectedDeposit} onBack={() => setSelectedDeposit(null)} />
      </div>
    );
  }

  const totalDeposited = MOCK_DEPOSITS.reduce((s, d) => s + parseFloat(d.depositedAmount), 0);
  const totalRemaining = MOCK_DEPOSITS.reduce((s, d) => s + parseFloat(d.remaining), 0);
  const totalTaken = MOCK_DEPOSITS.reduce((s, d) => s + parseFloat(d.taken), 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 pb-32 md:pb-12 max-w-5xl mx-auto space-y-5 animate-fade-in">

      {/* Header + New Deposit */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
          <p className="text-sm text-muted-foreground">Liquidity positions used to fulfill off-ramp orders.</p>
        </div>
        <InteractiveHoverButton
          text="New Deposit"
          onClick={() => navigate('/ramp?tab=Sell')}
          className="h-10 px-5 text-sm rounded-xl border-primary/40 text-foreground"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {([
          ['Total Deposited', `$${totalDeposited.toFixed(2)}`],
          ['Available', `$${totalRemaining.toFixed(2)}`],
          ['Taken (Filled)', `$${totalTaken.toFixed(2)}`],
        ] as const).map(([label, val]) => (
          <div key={label} className="bg-card border border-border rounded-xl px-4 py-3">
            <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{val}</p>
          </div>
        ))}
      </div>

      {/* Deposit table */}
      <div className="relative bg-card border border-border rounded-2xl overflow-hidden">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />

        {/* Table header */}
        <div className="grid grid-cols-7 gap-3 px-5 py-3 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          <span>Deposit ID</span>
          <span>Remaining</span>
          <span>Locked</span>
          <span>Taken</span>
          <span>Platform</span>
          <span>Currency</span>
          <span>Status</span>
        </div>

        {/* Table rows */}
        {MOCK_DEPOSITS.map(dep => (
          <button
            key={dep.id}
            onClick={() => setSelectedDeposit(dep)}
            className="grid grid-cols-7 gap-3 items-center px-5 py-4 border-b border-border last:border-b-0 w-full text-left hover:bg-secondary/40 transition-colors group"
          >
            <span className="text-sm font-semibold text-foreground">#{dep.id}</span>
            <div className="flex items-center gap-1.5">
              <CryptoIcon symbol="USDC" size={16} />
              <span className="text-sm text-foreground">{dep.remaining}</span>
            </div>
            <span className="text-sm text-muted-foreground">{dep.locked}</span>
            <div className="flex items-center gap-1.5">
              <CryptoIcon symbol="USDC" size={16} />
              <span className="text-sm text-foreground">{dep.taken}</span>
            </div>
            <RailIcon rail={dep.platform} size={20} />
            <span className="text-sm text-foreground">{dep.currency}</span>
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', STATUS_STYLES[dep.status])}>
                {dep.status}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
