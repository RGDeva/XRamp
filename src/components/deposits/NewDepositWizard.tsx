import { useState } from 'react';
import { X, ArrowLeft, Check, ChevronDown, Plus, Share2 } from 'lucide-react';
import { TokenSelectorModal } from '@/components/shared/TokenSelectorModal';
import { RailIcon, RAILS } from '@/components/shared/RailIcon';
import { SendSheet } from '@/components/deposits/SendSheet';
import { cn } from '@/lib/utils';

const TOKEN_COLORS: Record<string, string> = {
  USDC: '#2775CA', ETH: '#627EEA', AVAX: '#E84142',
  SOL: '#9945FF',  BTC: '#F7931A', MATIC: '#8247E5',
};
const TOKEN_LETTERS: Record<string, string> = {
  USDC: '$', ETH: '⟠', AVAX: 'A', SOL: '◎', BTC: '₿', MATIC: 'M',
};

interface Platform {
  railId: string;
  handle: string;
  minOrder: string;
  maxOrder: string;
}

interface WizardProps {
  onClose: () => void;
}

const STEPS = ['Deposit Amount', 'Add Platforms', 'Review & Create'];

export function NewDepositWizard({ onClose }: WizardProps) {
  const [step, setStep] = useState(0);
  const [token, setToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [retainOnEmpty, setRetainOnEmpty] = useState(true);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showRailPicker, setShowRailPicker] = useState(false);
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [createdDepositId] = useState(() => Math.floor(Math.random() * 1000) + 3000);
  const [pendingRail, setPendingRail] = useState(RAILS[0]);
  const [pendingHandle, setPendingHandle] = useState('');
  const [pendingMin, setPendingMin] = useState('0.1');
  const [pendingMax, setPendingMax] = useState('');

  const tokenColor = TOKEN_COLORS[token] ?? '#888';
  const tokenLetter = TOKEN_LETTERS[token] ?? token[0];
  const numAmount = parseFloat(amount) || 0;

  const addPlatform = () => {
    if (!pendingHandle.trim()) return;
    setPlatforms(prev => [...prev, {
      railId: pendingRail.id,
      handle: pendingHandle,
      minOrder: pendingMin,
      maxOrder: pendingMax || amount,
    }]);
    setPendingHandle('');
    setPendingMin('0.1');
    setPendingMax('');
    setShowRailPicker(false);
  };

  const removePlatform = (idx: number) => {
    setPlatforms(prev => prev.filter((_, i) => i !== idx));
  };

  const canProceedStep0 = numAmount > 0;
  const canProceedStep1 = platforms.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h2 className="text-base font-semibold">New Deposit</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 px-6 py-4 border-b border-border flex-shrink-0">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  i < step ? 'bg-primary text-primary-foreground' :
                  i === step ? 'bg-primary text-primary-foreground' :
                  'bg-secondary text-muted-foreground'
                )}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn(
                  'text-[10px] font-medium whitespace-nowrap',
                  i === step ? 'text-foreground' : 'text-muted-foreground'
                )}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'h-0.5 w-10 mx-1 mb-4 transition-colors',
                  i < step ? 'bg-primary' : 'bg-border'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Step 0: Deposit Amount ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium mb-2">Deposit amount</p>
                <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 focus-within:ring-1 focus-within:ring-primary/30">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    autoFocus
                  />
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
                <p className="text-xs text-muted-foreground mt-2">This amount will be locked in escrow and released to buyers as orders fill.</p>
              </div>

              {/* Retain on empty toggle */}
              <div className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Retain on empty</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Keep deposit open when balance runs out</p>
                </div>
                <button
                  onClick={() => setRetainOnEmpty(v => !v)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors flex-shrink-0',
                    retainOnEmpty ? 'bg-primary' : 'bg-secondary'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    retainOnEmpty ? 'translate-x-5' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Add Platforms ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Payment platforms</p>
                <button
                  onClick={() => setShowRailPicker(true)}
                  className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add platform
                </button>
              </div>

              {/* Added platforms */}
              {platforms.map((p, i) => {
                const rail = RAILS.find(r => r.id === p.railId)!;
                return (
                  <div key={i} className="flex items-center gap-3 bg-secondary/30 rounded-xl px-4 py-3">
                    <RailIcon rail={p.railId} size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{rail.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-green-400 font-medium">✓ Account</span>
                        <span className="text-xs text-green-400 font-medium">✓ Rates</span>
                        <span className="text-xs text-muted-foreground">{p.handle}</span>
                      </div>
                    </div>
                    <button onClick={() => removePlatform(i)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                );
              })}

              {platforms.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No platforms added yet. Click "Add platform" to get started.
                </div>
              )}

              {/* Rail picker inline form */}
              {showRailPicker && (
                <div className="bg-secondary/20 border border-border rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add platform</p>

                  {/* Rail selector */}
                  <div className="grid grid-cols-5 gap-2">
                    {RAILS.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setPendingRail(r)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors',
                          pendingRail.id === r.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary/50'
                        )}
                      >
                        <RailIcon rail={r.id} size={24} />
                        <span className="text-[10px] text-muted-foreground">{r.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>

                  {/* Handle input */}
                  <input
                    type="text"
                    value={pendingHandle}
                    onChange={e => setPendingHandle(e.target.value)}
                    placeholder={pendingRail.placeholder}
                    className="w-full bg-secondary/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
                  />

                  {/* Min/Max per order */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Min per order</p>
                      <input
                        type="text"
                        value={pendingMin}
                        onChange={e => setPendingMin(e.target.value)}
                        className="w-full bg-secondary/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                        placeholder="0.1"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Max per order</p>
                      <input
                        type="text"
                        value={pendingMax}
                        onChange={e => setPendingMax(e.target.value)}
                        className="w-full bg-secondary/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                        placeholder={amount || 'Full'}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRailPicker(false)}
                      className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addPlatform}
                      disabled={!pendingHandle.trim()}
                      className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Order limits accordion (collapsed) */}
              <button className="w-full flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors">
                <span className="font-medium">Order limits</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Review & Create ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Deposit summary</p>

              {/* Review section */}
              <div className="bg-secondary/20 border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Review</p>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { label: 'Deposit', value: `${amount} ${token}` },
                    { label: 'Min per order', value: platforms[0]?.minOrder ? `${platforms[0].minOrder} ${token}` : '—' },
                    { label: 'Max per order', value: platforms[0]?.maxOrder ? `${platforms[0].maxOrder} ${token}` : `${amount} ${token}` },
                    { label: 'Retain on empty', value: retainOnEmpty ? 'Enabled' : 'Disabled', highlight: retainOnEmpty },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className={cn('text-sm font-medium', row.highlight ? 'text-green-400' : 'text-foreground')}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                  <div className="px-4 py-2.5">
                    <p className="text-sm text-muted-foreground mb-1.5">Platforms</p>
                    {platforms.map((p, i) => {
                      const rail = RAILS.find(r => r.id === p.railId)!;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <RailIcon rail={p.railId} size={16} />
                          <span className="text-sm font-medium">{rail.name}</span>
                          <span className="text-sm text-muted-foreground">— {p.handle}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rates & proceeds */}
              <div className="bg-secondary/20 border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rates & Proceeds</p>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🇺🇸 USD</span>
                    <span className="text-xs text-green-400 font-medium">+0.0%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Rate</p>
                      <p className="font-medium">1 {token} = 1.00 USD</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">Proceeds</p>
                      <p className="font-medium">{amount || '0'} USD</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {step === 0 ? 'Continue' : 'Review & Create'}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setShowSendSheet(true)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Create & Send Deposit
              </button>
              <button
                className="w-full py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={onClose}
              >
                Create without sending
              </button>
            </div>
          )}
        </div>
      </div>

      <TokenSelectorModal
        open={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onSelect={setToken}
        selected={token}
      />

      <SendSheet
        open={showSendSheet}
        onClose={() => { setShowSendSheet(false); onClose(); }}
        depositId={createdDepositId}
        amount={amount}
        token={token}
        railId={platforms[0]?.railId ?? 'venmo'}
        railName={RAILS.find(r => r.id === (platforms[0]?.railId ?? 'venmo'))?.name ?? 'Venmo'}
        handle={platforms[0]?.handle ?? ''}
      />
    </div>
  );
}
