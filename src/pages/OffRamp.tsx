import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { TokenSelectorModal } from '@/components/shared/TokenSelectorModal';
import { cn } from '@/lib/utils';

const RAILS = [
  { id: 'venmo',   name: 'Venmo',   icon: '/icons/venmo.svg',   tag: '@username' },
  { id: 'cashapp', name: 'Cash App',icon: '/icons/cashapp.svg', tag: '$cashtag' },
  { id: 'zelle',   name: 'Zelle',   icon: '/icons/zelle.svg',   tag: 'email or phone' },
  { id: 'revolut', name: 'Revolut', icon: '/icons/revolut.svg', tag: '@revolut-tag' },
  { id: 'wise',    name: 'Wise',    icon: '/icons/wise.svg',    tag: 'email' },
];

const TOKEN_COLORS: Record<string, string> = {
  ETH:   '#627EEA', AVAX: '#E84142', SOL: '#9945FF',
  USDC:  '#2775CA', BASE: '#0052FF', HYPE: '#00FF88',
  BTC:   '#F7931A', MATIC:'#8247E5', ARB: '#12AAFF', LINK: '#375BD2',
};
const TOKEN_LETTERS: Record<string, string> = {
  ETH:'⟠', AVAX:'A', SOL:'◎', USDC:'$', BASE:'B',
  HYPE:'H', BTC:'₿', MATIC:'M', ARB:'A', LINK:'L',
};

export default function OffRamp() {
  const [amount, setAmount] = useState('100');
  const [token, setToken] = useState('AVAX');
  const [rail, setRail] = useState(RAILS[0]);
  const [railTag, setRailTag] = useState('');
  const [minFiat, setMinFiat] = useState(10);
  const [expiry, setExpiry] = useState(7);
  const [showRailDropdown, setShowRailDropdown] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const estMatches = Math.max(1, Math.floor(numAmount / minFiat));

  const selectedRail = rail;
  const tokenColor = TOKEN_COLORS[token] ?? '#888';
  const tokenLetter = TOKEN_LETTERS[token] ?? token[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8 pb-32 md:pb-12">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground">Sell Crypto for Fiat</h1>
          <p className="text-sm text-muted-foreground mt-1">Lock crypto in escrow, get paid via your preferred rail.</p>
        </div>

        {/* Main form card */}
        <div className="relative bg-card border border-border rounded-2xl p-5 space-y-5 shadow-elevated animate-fade-in">
          <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />

          {/* Escrow amount */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Escrow amount</p>
            <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 focus-within:ring-1 focus-within:ring-primary/30">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="flex-1 bg-transparent text-3xl font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                placeholder="0"
              />
              {/* Token selector button */}
              <button
                onClick={() => setShowTokenModal(true)}
                className="flex items-center gap-2 bg-muted/60 hover:bg-muted rounded-lg px-3 py-2 transition-colors flex-shrink-0"
              >
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: tokenColor }}
                >
                  {tokenLetter}
                </div>
                <span className="font-semibold text-sm">{token}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Payout rail */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Payout rail</p>
            <div className="relative">
              <button
                onClick={() => setShowRailDropdown(!showRailDropdown)}
                className="w-full flex items-center justify-between bg-secondary/50 hover:bg-secondary rounded-xl px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img src={selectedRail.icon} width={24} height={24} alt={selectedRail.name} className="rounded" />
                  <span className="font-medium text-sm">{selectedRail.name}</span>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', showRailDropdown && 'rotate-180')} />
              </button>

              {showRailDropdown && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-elevated z-20 overflow-hidden">
                  {RAILS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { setRail(r); setShowRailDropdown(false); setRailTag(''); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left',
                        rail.id === r.id && 'bg-primary/10'
                      )}
                    >
                      <img src={r.icon} width={24} height={24} alt={r.name} className="rounded" />
                      <span className="font-medium text-sm">{r.name}</span>
                      {rail.id === r.id && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rail tag input */}
            <input
              type="text"
              value={railTag}
              onChange={e => setRailTag(e.target.value)}
              placeholder={selectedRail.tag}
              className="mt-2 w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
          </div>

          {/* Min fiat slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Min trade size</p>
              <span className="text-sm font-semibold">${minFiat}</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={minFiat}
              onChange={e => setMinFiat(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$10</span>
              <span>$100</span>
            </div>
          </div>

          {/* Rate + Expiry row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Rate</p>
              <p className="text-sm font-semibold">1 : 1 <span className="text-xs text-muted-foreground font-normal">(market)</span></p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Expiry</p>
                <span className="text-xs font-semibold">{expiry}d</span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={expiry}
                onChange={e => setExpiry(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>1d</span>
                <span>7d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview card */}
        <div className="relative bg-card border border-border rounded-2xl p-5 shadow-elevated">
          <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
          <div className="flex items-start gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order preview</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lock{' '}
            <span className="font-semibold text-foreground">{amount || '0'} {token}</span>
            {' '}for min{' '}
            <span className="font-semibold text-foreground">${minFiat}</span>
            {' '}trades, rate{' '}
            <span className="font-semibold text-foreground">1:1</span>
            ,{' '}
            <span className="font-semibold text-foreground">{expiry}d</span>
            {' '}expiry, est{' '}
            <span className="font-semibold text-foreground">{estMatches} match{estMatches !== 1 ? 'es' : ''}</span>
            {' '}via{' '}
            <span className="font-semibold text-foreground">{selectedRail.name}</span>.
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <InteractiveHoverButton
            text="Create Deposit"
            className="w-full h-12 text-base rounded-xl border-green-500/40 text-foreground bg-green-500/10 hover:bg-green-500/20"
            onClick={() => {/* mock – no submit */}}
          />
          <button
            className="w-full h-12 rounded-xl border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
            onClick={() => {
              // fetch('/api/sign') — WhatsApp agent handoff placeholder
            }}
          >
            Sign via Agent
          </button>
        </div>
      </div>

      <TokenSelectorModal
        open={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onSelect={setToken}
        selected={token}
      />
    </div>
  );
}
