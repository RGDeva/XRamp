import { useState } from 'react';
import { Plus, RotateCcw, TrendingUp, BarChart2, Target, ChevronDown, ChevronRight, Pause, X, Copy } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { NewDepositWizard } from '@/components/deposits/NewDepositWizard';
import { cn } from '@/lib/utils';

type DepositStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
type TabFilter = 'Active' | 'Paused' | 'History';

interface Deposit {
  id: number;
  remaining: string;
  locked: string | null;
  taken: string;
  platform: string;
  platformIcon: string;
  currency: string;
  status: DepositStatus;
  token: string;
  handle: string;
}

const MOCK_DEPOSITS: Deposit[] = [
  { id: 2441, remaining: '0.00', locked: null, taken: '18.69', platform: 'Venmo',   platformIcon: '/icons/venmo.svg',   currency: 'USD', status: 'PAUSED', token: 'USDC', handle: '@xramp-seller' },
  { id: 2428, remaining: '0.00', locked: null, taken: '6.69',  platform: 'Venmo',   platformIcon: '/icons/venmo.svg',   currency: 'USD', status: 'ACTIVE', token: 'USDC', handle: '@xramp-seller' },
  { id: 2426, remaining: '0.00', locked: null, taken: '10.00', platform: 'Venmo',   platformIcon: '/icons/venmo.svg',   currency: 'USD', status: 'PAUSED', token: 'USDC', handle: '@xramp-seller' },
  { id: 2310, remaining: '5.00', locked: null, taken: '25.00', platform: 'Cash App', platformIcon: '/icons/cashapp.svg', currency: 'USD', status: 'CLOSED', token: 'USDC', handle: '$xramp' },
];

const RAIL_ICONS: Record<string, string> = {
  Venmo: '/icons/venmo.svg',
  'Cash App': '/icons/cashapp.svg',
  Zelle: '/icons/zelle.svg',
  Revolut: '/icons/revolut.svg',
  Wise: '/icons/wise.svg',
};

const STATUS_STYLES: Record<DepositStatus, string> = {
  ACTIVE: 'bg-green-500/15 text-green-400 border border-green-500/30',
  PAUSED: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  CLOSED: 'bg-muted text-muted-foreground border border-border',
};

export default function Deposits() {
  const [tab, setTab] = useState<TabFilter>('Active');
  const [showWizard, setShowWizard] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = MOCK_DEPOSITS.filter(d => {
    if (tab === 'Active')  return d.status === 'ACTIVE';
    if (tab === 'Paused')  return d.status === 'PAUSED';
    if (tab === 'History') return d.status === 'CLOSED';
    return true;
  });

  const totalReceived = 25.38;
  const totalFills = 4;
  const totalSold = 35.38;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 pb-32 md:pb-12 max-w-3xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage USDC liquidity deposits for fiat off-ramp orders.</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Deposit
        </button>
      </div>

      {/* Rail icons strip */}
      <div className="flex items-center gap-3 mb-6">
        {Object.entries(RAIL_ICONS).map(([name, icon]) => (
          <div key={name} className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden shadow-sm" title={name}>
            <img src={icon} width={22} height={22} alt={name} />
          </div>
        ))}
      </div>

      {/* Tabs + sort */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-secondary/40 rounded-xl p-1">
          {(['Active', 'Paused', 'History'] as TabFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RotateCcw className="h-3.5 w-3.5" />
          Newest first
        </button>
      </div>

      {/* Deposit rows */}
      <div className="space-y-2 mb-6">
        {filtered.length === 0 ? (
          <div className="relative bg-card border border-border rounded-2xl p-10 text-center">
            <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground mb-1">No deposit history</p>
            <p className="text-sm text-muted-foreground mb-4">When you close deposits, they will appear here for your records.</p>
            <button
              onClick={() => setTab('Active')}
              className="text-sm border border-border rounded-full px-4 py-1.5 hover:bg-secondary transition-colors"
            >
              View active deposits
            </button>
          </div>
        ) : (
          filtered.map(dep => (
            <div key={dep.id} className="relative bg-card border border-border rounded-2xl overflow-hidden">
              <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />

              {/* Main row */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-secondary/20 transition-colors"
                onClick={() => setExpandedId(expandedId === dep.id ? null : dep.id)}
              >
                {/* Token icon */}
                <div className="h-9 w-9 rounded-full bg-[#2775CA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">$</div>

                {/* Amount info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{dep.remaining} {dep.token}</span>
                    <span className="text-xs text-muted-foreground">· {dep.taken} sold</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <img src={dep.platformIcon} width={14} height={14} alt={dep.platform} className="rounded" />
                    <span className="text-xs text-muted-foreground">{dep.platform}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">🇺🇸 {dep.currency} · 1.000</span>
                  </div>
                </div>

                {/* ID + status */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">#{dep.id}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_STYLES[dep.status])}>
                    {dep.status}
                  </span>
                  <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', expandedId === dep.id && 'rotate-90')} />
                </div>
              </button>

              {/* Expanded actions */}
              {expandedId === dep.id && (
                <div className="border-t border-border px-5 py-3 flex items-center gap-3 bg-secondary/20">
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary">
                    <Pause className="h-3.5 w-3.5" /> {dep.status === 'PAUSED' ? 'Resume' : 'Pause'}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary">
                    <TrendingUp className="h-3.5 w-3.5" /> Rate
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/10 ml-auto">
                    <X className="h-3.5 w-3.5" /> Close
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Earnings card */}
      <div className="relative bg-card border border-border rounded-2xl p-5 mb-3 shadow-elevated">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Earnings</span>
          </div>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2.5 py-1">
            Export ({totalFills})
          </button>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs text-green-400 font-medium">↑ Received</span>
            <span className="text-xs text-muted-foreground">· {totalFills} fills</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇺🇸</span>
            <span className="text-3xl font-bold text-foreground">{totalReceived.toFixed(2)}</span>
            <span className="text-lg font-semibold text-muted-foreground">USD</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">$ {totalSold} USDC sold · 0.0000 avg</p>
        </div>

        <button className="w-full flex items-center justify-between py-3 border-t border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Set an earnings goal</span>
          </div>
          <span className="text-xs">Track your progress towards a target</span>
        </button>
      </div>

      {/* Performance insights */}
      <div className="relative bg-card border border-border rounded-2xl px-5 py-4 shadow-elevated">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Performance Insights</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-400 font-medium">100% fill rate</span>
            <span className="text-xs text-muted-foreground">· {totalFills} fills (30 days)</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* New Deposit Wizard */}
      {showWizard && <NewDepositWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
