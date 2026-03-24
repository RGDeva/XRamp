import { useState, useRef, useEffect } from 'react';
import KineticDotsLoader from '@/components/ui/kinetic-dots-loader';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChevronDown, X, Send as SendIcon,
  Search, Check, AlertCircle, ChevronRight, Info,
} from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { CryptoIcon, TOKENS, type Token } from '@/components/shared/CryptoIcon';
import { RailIcon } from '@/components/shared/RailIcon';
import { PaymentMethodPicker, getPaymentMethodById } from '@/components/shared/PaymentMethodPicker';
import { QuotesCard, type OrchestratorQuote } from '@/components/shared/QuotesCard';
import { SendSheet } from '@/components/deposits/SendSheet';
import { orchestratorApi } from '@/lib/orchestratorApi';
import { getProvider } from '@/lib/providers';
import { createXRampSdk, type XRampSdk, type XRampState, type IntentFulfilledData } from '@/lib/xrampSdk';
import { createCommandEngine, formatCompletionMessage, type CommandEngine } from '@/lib/xrampCommandEngine';
import { cn } from '@/lib/utils';

type RampTab = 'Buy' | 'Sell' | 'Send';

const CHAIN_LABELS: Record<string, string> = {
  avalanche: 'Avalanche', ethereum: 'Ethereum', base: 'Base',
  arbitrum: 'Arbitrum', solana: 'Solana', other: 'Other',
};
const CHAIN_ORDER = ['avalanche', 'ethereum', 'base', 'arbitrum', 'solana', 'other'];



function TokenPicker({
  open, onClose, selected, onSelect,
}: {
  open: boolean; onClose: () => void; selected: Token; onSelect: (t: Token) => void;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
  if (!open) return null;

  const query = search.toLowerCase();
  const filtered = TOKENS.filter(t =>
    t.symbol.toLowerCase().includes(query) ||
    t.name.toLowerCase().includes(query) ||
    t.network.toLowerCase().includes(query),
  );
  const grouped = CHAIN_ORDER.map(chain => ({
    chain, label: CHAIN_LABELS[chain],
    tokens: filtered.filter(t => t.chain === chain),
  })).filter(g => g.tokens.length > 0);

  const quickTokens = TOKENS.filter(t => ['USDC','AVAX','USDT','BTC.b','WAVAX'].includes(t.symbol));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Select token</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="px-5 py-3">
          <div className="flex items-center gap-2 bg-secondary/60 rounded-xl px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef} type="text" placeholder="Search tokens or chains…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        {!search && (
          <div className="flex gap-2 px-5 pb-3 flex-wrap">
            {quickTokens.map(t => (
              <button key={t.symbol} onClick={() => { onSelect(t); onClose(); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  selected.symbol === t.symbol
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary/50 hover:border-primary/50 text-foreground',
                )}>
                <CryptoIcon symbol={t.symbol} size={16} />{t.symbol}
              </button>
            ))}
          </div>
        )}
        <div className="overflow-y-auto flex-1 px-3 pb-5">
          {grouped.map(({ chain, label, tokens }) => (
            <div key={chain}>
              <div className="px-3 pt-4 pb-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
              </div>
              {tokens.map(token => (
                <button key={token.symbol} onClick={() => { onSelect(token); onClose(); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left',
                    selected.symbol === token.symbol ? 'bg-primary/10' : 'hover:bg-secondary/50',
                  )}>
                  <CryptoIcon symbol={token.symbol} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">{token.name} · {token.network}</p>
                    {token.address && (
                      <p className="text-[10px] text-muted-foreground/60 font-mono">{token.address.slice(0,6)}…{token.address.slice(-4)}</p>
                    )}
                  </div>
                  {selected.symbol === token.symbol && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          ))}
          {grouped.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No tokens found</p>}
        </div>
      </div>
    </div>
  );
}

export default function Ramp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, login, user } = useAuth();

  const rawTab = searchParams.get('tab') ?? '';
  const initialTab = (['Buy','Sell','Send'].includes(rawTab) ? rawTab : 'Buy') as RampTab;
  const [tab, setTab] = useState<RampTab>(initialTab);

  const [buyAmount, setBuyAmount] = useState('');
  const [buyToken, setBuyToken] = useState<Token>(TOKENS.find(t => t.symbol === 'USDC') ?? TOKENS[0]);
  const [showBuyTokenPicker, setShowBuyTokenPicker] = useState(false);
  const [buyMethod, setBuyMethod] = useState<string | null>(null);
  const [showBuyMethodPicker, setShowBuyMethodPicker] = useState(false);
  const [buyHandle, setBuyHandle] = useState('');
  const [buySubmitting, setBuySubmitting] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const [sellAmount, setSellAmount] = useState('');
  const [sellToken, setSellToken] = useState<Token>(TOKENS.find(t => t.symbol === 'USDC') ?? TOKENS[0]);
  const [showSellTokenPicker, setShowSellTokenPicker] = useState(false);
  const [sellMethod, setSellMethod] = useState<string | null>(null);
  const [showSellMethodPicker, setShowSellMethodPicker] = useState(false);
  const [sellHandle, setSellHandle] = useState('');
  const [sellSubmitting, setSellSubmitting] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);

  const [sendAmount, setSendAmount] = useState('');
  const [sendToken, setSendToken] = useState<Token>(TOKENS[1]);
  const [showSendTokenPicker, setShowSendTokenPicker] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [receiveToken, setReceiveToken] = useState<Token>(TOKENS[0]);
  const [showReceiveTokenPicker, setShowReceiveTokenPicker] = useState(false);
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [mockDepositId] = useState(Math.floor(3000 + Math.random() * 999));

  const getUserId = () => user?.email || user?.walletAddress || user?.embeddedWalletAddress || 'guest';

  const [savedHandles, setSavedHandles] = useState<Record<string, string>>({});
  const [xrampSdk, setXrampSdk] = useState<XRampSdk | null>(null);
  const [commandEngine, setCommandEngine] = useState<CommandEngine | null>(null);
  const [extensionState, setExtensionState] = useState<XRampState>('needs_install');
  const [sdkFulfilled, setSdkFulfilled] = useState<IntentFulfilledData | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<OrchestratorQuote | null>(null);

  // Detect XRamp extension on mount
  useEffect(() => {
    const sdk = createXRampSdk({ window });
    setXrampSdk(sdk);
    setCommandEngine(createCommandEngine({ sdk }));
    sdk.getState().then(setExtensionState);
    const unsub = sdk.onIntentFulfilled((data) => {
      setSdkFulfilled(data);
    });
    return () => { unsub(); sdk.destroy(); };
  }, []);

  // Load saved handles once on auth
  useEffect(() => {
    if (!isAuthenticated) return;
    orchestratorApi.getPreferences()
      .then(({ preferences }) => {
        const map: Record<string, string> = {};
        if (preferences.venmoHandle)   map['venmo']   = preferences.venmoHandle;
        if (preferences.cashappHandle) map['cashapp'] = preferences.cashappHandle;
        if (preferences.paypalHandle)  map['paypal']  = preferences.paypalHandle;
        if (preferences.zelleHandle)   map['zelle']   = preferences.zelleHandle;
        if (preferences.wiseHandle)    map['wise']    = preferences.wiseHandle;
        if (preferences.revolutHandle) map['revolut'] = preferences.revolutHandle;
        setSavedHandles(map);
      })
      .catch(() => null);
  }, [isAuthenticated]);

  // Prefill buy handle when method selected
  useEffect(() => {
    if (!buyMethod) return;
    const saved = savedHandles[buyMethod];
    if (saved) setBuyHandle(h => h || saved);
  }, [buyMethod, savedHandles]);

  // Prefill sell handle when method selected
  useEffect(() => {
    if (!sellMethod) return;
    const saved = savedHandles[sellMethod];
    if (saved) setSellHandle(h => h || saved);
  }, [sellMethod, savedHandles]);

  // Listen for postMessage from XRamp Chrome extension to prefill state
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'XRAMP_CONTEXT') return;
      const p = event.data.payload;
      if (p?.tab && ['Buy', 'Sell', 'Send'].includes(p.tab)) setTab(p.tab as RampTab);
      if (p?.amount) setBuyAmount(p.amount);
      if (p?.rail) { setBuyMethod(p.rail); setSellMethod(p.rail); }
      if (p?.asset) {
        const found = TOKENS.find(t => t.symbol.toLowerCase() === p.asset.toLowerCase());
        if (found) { setBuyToken(found); setSellToken(found); }
      }
    };
    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, []);

  const buyNum = parseFloat(buyAmount) || 0;
  const buyFee = (buyNum * 0.005).toFixed(2);
  const buyReceive = buyNum > 0 ? (buyNum - buyNum * 0.005).toFixed(2) : '';
  const buySelectedMethod = buyMethod ? getPaymentMethodById(buyMethod) : null;
  const buyHandleMeta = buyMethod ? getProvider(buyMethod).handleMeta : null;
  const buyRequiresHandle = !!buyMethod && buyMethod !== 'bank';
  const buyHasHandle = !buyRequiresHandle || buyHandle.trim().length > 0;
  const buyCanContinue = buyNum > 0 && !!buyMethod && buyHasHandle;

  const sellNum = parseFloat(sellAmount) || 0;
  const sellReceive = sellNum > 0 ? (sellNum * (1 - 0.01)).toFixed(2) : '';
  const sellSelectedMethod = sellMethod ? getPaymentMethodById(sellMethod) : null;
  const sellHandleMeta = sellMethod ? getProvider(sellMethod).handleMeta : null;
  const sellRequiresHandle = !!sellMethod && sellMethod !== 'bank';
  const sellHasHandle = !sellRequiresHandle || sellHandle.trim().length > 0;
  const sellCanContinue = sellNum > 0 && !!sellMethod && sellHasHandle;

  const handleBuyMethodChange = (id: string) => { setBuyMethod(id); setBuyHandle(''); };
  const handleSellMethodChange = (id: string) => { setSellMethod(id); setSellHandle(''); };

  const handleBuyContinue = async () => {
    if (!isAuthenticated) { login(); return; }
    if (!buyCanContinue) return;
    try {
      setBuySubmitting(true); setBuyError(null);
      if (buyHandle.trim() && buyMethod) {
        const key = (buyMethod + 'Handle') as 'venmoHandle' | 'cashappHandle' | 'paypalHandle' | 'zelleHandle' | 'wiseHandle' | 'revolutHandle';
        orchestratorApi.savePreferences({ [key]: buyHandle.trim() }).catch(() => null);
      }
      const { intent } = await orchestratorApi.createOnrampIntent({
        userId: getUserId(), amount: buyAmount,
        sourceAsset: 'USD', targetAsset: buyToken.symbol,
        rail: selectedQuote?.provider ?? buyMethod ?? undefined,
        paymentHandle: buyHandle.trim() || undefined,
        quoteId: selectedQuote?.id,
        quoteSnapshot: selectedQuote ? {
          provider: selectedQuote.provider,
          outputAmount: selectedQuote.outputAmount,
          feeAmount: selectedQuote.feeAmount,
          feeBps: selectedQuote.feeBps,
          etaSeconds: selectedQuote.etaSeconds,
          routeType: selectedQuote.routeType,
          source: selectedQuote.source,
        } : undefined,
        quoteSource: selectedQuote?.source,
        quotePartnerId: selectedQuote?.partnerId,
        quotePartnerName: selectedQuote?.partnerName,
      });
      navigate('/buy/review', { state: {
        payAmount: buyAmount, receiveAmount: buyReceive,
        paymentMethod: buyMethod, paymentHandle: buyHandle.trim(), currency: 'USD',
        crypto: buyToken.symbol, intentId: intent.id,
      }});
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'Failed');
    } finally { setBuySubmitting(false); }
  };

  const handleSellContinue = async () => {
    if (!isAuthenticated) { login(); return; }
    if (!sellCanContinue) return;
    try {
      setSellSubmitting(true); setSellError(null);
      if (sellHandle.trim() && sellMethod) {
        const key = (sellMethod + 'Handle') as 'venmoHandle' | 'cashappHandle' | 'paypalHandle' | 'zelleHandle' | 'wiseHandle' | 'revolutHandle';
        orchestratorApi.savePreferences({ [key]: sellHandle.trim() }).catch(() => null);
      }
      const { intent } = await orchestratorApi.createOfframpIntent({
        userId: getUserId(), amount: sellAmount,
        sourceAsset: sellToken.symbol, targetAsset: 'USD',
        rail: sellMethod ?? undefined,
        paymentHandle: sellHandle.trim() || undefined,
      });
      navigate('/sell/review', { state: {
        sellAmount, receiveAmount: sellReceive,
        payoutMethod: sellMethod, payoutHandle: sellHandle.trim(),
        currency: 'USD', crypto: sellToken.symbol, intentId: intent.id,
      }});
    } catch (e) {
      setSellError(e instanceof Error ? e.message : 'Failed');
    } finally { setSellSubmitting(false); }
  };

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-8">

          {/* SDK Completion Banner */}
          {sdkFulfilled && (
            <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm font-semibold text-green-400">Funds Delivered</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCompletionMessage({
                  amount: sdkFulfilled.amount,
                  provider: sdkFulfilled.rail,
                  destination: sdkFulfilled.destination,
                })}
              </p>
              <div className="flex gap-2">
                {sdkFulfilled.destination?.app === 'lfj' && (
                  <a href="https://lfj.gg" target="_blank" rel="noopener noreferrer"
                    className="flex-1 h-9 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/15 transition-colors">
                    Continue in LFJ →
                  </a>
                )}
                <button onClick={() => navigate('/activity')}
                  className="flex-1 h-9 rounded-lg bg-secondary border border-border text-xs font-medium text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors">
                  View Activity
                </button>
                <button onClick={() => setSdkFulfilled(null)}
                  className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0 mb-8 border-b border-border">
            {(['Buy', 'Sell', 'Send'] as RampTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn(
                  'px-7 py-3 text-base font-semibold transition-all border-b-2 -mb-px',
                  tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}>
                {t}
              </button>
            ))}
          </div>

          {/* ── BUY ── */}
          {tab === 'Buy' && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative bg-card border border-border rounded-2xl p-5 space-y-4 shadow-elevated">
                <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">You pay</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <input type="number" value={buyAmount} onChange={e => setBuyAmount(e.target.value)} placeholder="0"
                        className="w-full pl-7 pr-3 py-3.5 text-xl font-bold text-foreground bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                    </div>
                    <span className="flex items-center px-3.5 bg-secondary border border-border rounded-xl text-sm font-medium text-muted-foreground">USD</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">You receive</p>
                  <div className="flex gap-2">
                    <input readOnly value={buyReceive} placeholder="0"
                      className="flex-1 px-3.5 py-3.5 text-xl font-bold text-foreground bg-secondary/50 border border-border rounded-xl cursor-default focus:outline-none" />
                    <button onClick={() => setShowBuyTokenPicker(true)}
                      className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3.5 py-2.5 hover:border-primary/50 transition-all min-w-[120px] justify-between">
                      <div className="flex items-center gap-2">
                        <CryptoIcon symbol={buyToken.symbol} size={28} />
                        <div className="text-left">
                          <div className="font-bold text-foreground text-sm leading-tight">{buyToken.symbol}</div>
                          <div className="text-[10px] text-muted-foreground leading-none">{buyToken.chain === 'avalanche' ? 'Avalanche' : buyToken.network.split(' ')[0]}</div>
                        </div>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  {buyNum > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5">1 USD = 1 USDC · Fee: ${buyFee}</p>
                  )}
                </div>
                {buyNum > 0 && (
                  <QuotesCard
                    payAmount={buyAmount}
                    payCurrency="USD"
                    receiveCrypto={buyToken.symbol}
                    destination={isAuthenticated ? {
                      chainId: 43113,
                      token: buyToken.symbol,
                      recipientAddress: user?.walletAddress || user?.embeddedWalletAddress || '',
                    } : undefined}
                    selectedQuoteId={selectedQuote?.id}
                    onSelect={(q) => {
                      setSelectedQuote(q);
                      setBuyMethod(q.provider);
                    }}
                  />
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment method</p>
                  <button onClick={() => setShowBuyMethodPicker(true)}
                    className="w-full rounded-xl p-4 bg-secondary/50 hover:bg-secondary transition-colors text-left">
                    {buySelectedMethod ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RailIcon rail={buySelectedMethod.id} size={36} />
                          <div>
                            <p className="font-medium text-sm">{buySelectedMethod.name}</p>
                            <p className="text-xs text-muted-foreground">Limit ${buySelectedMethod.maxAmount.toLocaleString()} · {buySelectedMethod.eta}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Choose a method</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                </div>
                {buyHandleMeta && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{buyHandleMeta.label}</p>
                    <div className="relative">
                      {buyHandleMeta.prefix && (
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">{buyHandleMeta.prefix}</span>
                      )}
                      <input type="text" value={buyHandle} onChange={e => setBuyHandle(e.target.value)}
                        placeholder={buyHandleMeta.placeholder} autoComplete="off" spellCheck={false}
                        className={cn(
                          'w-full rounded-xl p-3.5 bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all',
                          buyHandleMeta.prefix ? 'pl-7' : 'pl-3.5',
                        )} />
                    </div>
                  </div>
                )}
                {buyError && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /><span>{buyError}</span>
                  </div>
                )}
              </div>
              {buySubmitting && (
                <div className="flex justify-center">
                  <KineticDotsLoader dots={3} className="py-0" />
                </div>
              )}
              <InteractiveHoverButton
                text={buySubmitting ? 'Matching LP…' : isAuthenticated ? 'Continue' : 'Log in to continue'}
                onClick={handleBuyContinue}
                disabled={buySubmitting || (isAuthenticated && !buyCanContinue)}
                className="w-full h-12 text-base rounded-xl border-primary/40 text-foreground"
              />
              {extensionState === 'ready' && buyCanContinue && (
                <button
                  onClick={() => commandEngine?.executeCommand({
                    action: 'fund_destination',
                    amount: buyAmount,
                    provider: selectedQuote?.provider as 'revolut' | 'venmo' | 'wise' | undefined,
                    destination: {
                      chainId: 43113,
                      token: buyToken.symbol,
                      recipientAddress: user?.walletAddress || user?.embeddedWalletAddress || '',
                    },
                  }).catch(e => setBuyError(e instanceof Error ? e.message : 'Extension error'))}
                  className="w-full h-11 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  {selectedQuote ? `Fund via ${selectedQuote.provider.charAt(0).toUpperCase() + selectedQuote.provider.slice(1)} · ${parseFloat(selectedQuote.outputAmount).toFixed(2)} ${buyToken.symbol}` : 'Fund with XRamp Extension'}
                </button>
              )}
            </div>
          )}

          {/* ── SELL ── */}
          {tab === 'Sell' && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative bg-card border border-border rounded-2xl p-5 space-y-4 shadow-elevated">
                <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">You sell</p>
                  <div className="flex gap-2">
                    <input type="number" value={sellAmount} onChange={e => setSellAmount(e.target.value)} placeholder="0"
                      className="flex-1 px-3.5 py-3.5 text-xl font-bold text-foreground bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                    <button onClick={() => setShowSellTokenPicker(true)}
                      className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3.5 py-2.5 hover:border-primary/50 transition-all min-w-[120px] justify-between">
                      <div className="flex items-center gap-2">
                        <CryptoIcon symbol={sellToken.symbol} size={28} />
                        <div className="text-left">
                          <div className="font-bold text-foreground text-sm leading-tight">{sellToken.symbol}</div>
                          <div className="text-[10px] text-muted-foreground leading-none">{sellToken.chain === 'avalanche' ? 'Avalanche' : sellToken.network.split(' ')[0]}</div>
                        </div>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">You receive</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <input readOnly value={sellReceive} placeholder="0"
                        className="w-full pl-7 pr-3 py-3.5 text-xl font-bold text-foreground bg-secondary/50 border border-border rounded-xl cursor-default focus:outline-none" />
                    </div>
                    <span className="flex items-center px-3.5 bg-secondary border border-border rounded-xl text-sm font-medium text-muted-foreground">USD</span>
                  </div>
                  {sellNum > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5">1 USDC = 1 USD · 1% fee</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payout method</p>
                  <button onClick={() => setShowSellMethodPicker(true)}
                    className="w-full rounded-xl p-4 bg-secondary/50 hover:bg-secondary transition-colors text-left">
                    {sellSelectedMethod ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RailIcon rail={sellSelectedMethod.id} size={36} />
                          <div>
                            <p className="font-medium text-sm">{sellSelectedMethod.name}</p>
                            <p className="text-xs text-muted-foreground">Limit ${sellSelectedMethod.maxAmount.toLocaleString()} · {sellSelectedMethod.eta}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Choose a method</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                </div>
                {sellHandleMeta && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{sellHandleMeta.label}</p>
                    <div className="relative">
                      {sellHandleMeta.prefix && (
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">{sellHandleMeta.prefix}</span>
                      )}
                      <input type="text" value={sellHandle} onChange={e => setSellHandle(e.target.value)}
                        placeholder={sellHandleMeta.placeholder} autoComplete="off" spellCheck={false}
                        className={cn(
                          'w-full rounded-xl p-3.5 bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all',
                          sellHandleMeta.prefix ? 'pl-7' : 'pl-3.5',
                        )} />
                    </div>
                  </div>
                )}
                {sellError && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /><span>{sellError}</span>
                  </div>
                )}
              </div>
              {sellSubmitting && (
                <div className="flex justify-center">
                  <KineticDotsLoader dots={3} className="py-0" />
                </div>
              )}
              <InteractiveHoverButton
                text={sellSubmitting ? 'Matching LP…' : isAuthenticated ? 'Continue' : 'Log in to continue'}
                onClick={handleSellContinue}
                disabled={sellSubmitting || (isAuthenticated && !sellCanContinue)}
                className="w-full h-12 text-base rounded-xl border-primary/40 text-foreground"
              />
            </div>
          )}

          {/* ── SEND ── */}
          {tab === 'Send' && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative bg-card border border-border rounded-2xl p-5 space-y-4 shadow-elevated">
                <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">You send</p>
                  <div className="flex gap-2">
                    <input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} placeholder="0.00"
                      className="flex-1 px-3.5 py-3.5 text-xl font-bold text-foreground bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                    <button onClick={() => setShowSendTokenPicker(true)}
                      className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3.5 py-2.5 hover:border-primary/50 transition-all min-w-[110px] justify-between">
                      <div className="flex items-center gap-2">
                        <CryptoIcon symbol={sendToken.symbol} size={28} />
                        <div className="text-left">
                          <div className="font-bold text-foreground text-sm leading-tight">{sendToken.symbol}</div>
                          <div className="text-[10px] text-muted-foreground leading-none">Avalanche</div>
                        </div>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Recipient wallet address</p>
                  <input type="text" value={walletAddress} onChange={e => setWalletAddress(e.target.value)}
                    placeholder="0x… or wallet address"
                    className="w-full px-3.5 py-3.5 text-sm font-mono text-foreground bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40 placeholder:font-sans" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">They receive</p>
                  <button onClick={() => setShowReceiveTokenPicker(true)}
                    className="w-full flex items-center justify-between bg-secondary border border-border rounded-xl px-3.5 py-3 hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-3">
                      <CryptoIcon symbol={receiveToken.symbol} size={36} />
                      <div className="text-left">
                        <div className="font-bold text-foreground text-sm leading-tight">{receiveToken.symbol}</div>
                        <div className="text-xs text-muted-foreground leading-tight">{receiveToken.network}</div>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                {sendAmount && parseFloat(sendAmount) > 0 && walletAddress.trim() && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sending</span>
                      <span className="font-semibold">{sendAmount} {sendToken.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">To</span>
                      <span className="font-mono text-xs truncate max-w-[180px]">{walletAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receive</span>
                      <div className="flex items-center gap-1.5">
                        <CryptoIcon symbol={receiveToken.symbol} size={16} />
                        <span className="font-semibold">{receiveToken.symbol}</span>
                        <span className="text-muted-foreground text-xs">on {receiveToken.network}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-primary/10">
                      <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">0.5% protocol fee included · Rate locked at send</p>
                    </div>
                  </div>
                )}
              </div>
              <InteractiveHoverButton
                text="Send"
                onClick={() => setShowSendSheet(true)}
                disabled={!sendAmount || parseFloat(sendAmount) <= 0 || !walletAddress.trim()}
                className="w-full h-12 text-base rounded-xl border-primary/40 text-foreground"
              />
            </div>
          )}
        </div>

      <TokenPicker open={showBuyTokenPicker}     onClose={() => setShowBuyTokenPicker(false)}     selected={buyToken}     onSelect={setBuyToken} />
      <TokenPicker open={showSellTokenPicker}    onClose={() => setShowSellTokenPicker(false)}    selected={sellToken}    onSelect={setSellToken} />
      <TokenPicker open={showSendTokenPicker}    onClose={() => setShowSendTokenPicker(false)}    selected={sendToken}    onSelect={setSendToken} />
      <TokenPicker open={showReceiveTokenPicker} onClose={() => setShowReceiveTokenPicker(false)} selected={receiveToken} onSelect={setReceiveToken} />

      <PaymentMethodPicker
        open={showBuyMethodPicker} onOpenChange={setShowBuyMethodPicker}
        value={buyMethod || ''} onValueChange={handleBuyMethodChange}
        type="payment" amount={buyNum} currency="USD"
      />
      <PaymentMethodPicker
        open={showSellMethodPicker} onOpenChange={setShowSellMethodPicker}
        value={sellMethod || ''} onValueChange={handleSellMethodChange}
        type="payout" amount={sellNum} currency="USD"
      />

      <SendSheet
        open={showSendSheet} onClose={() => setShowSendSheet(false)}
        depositId={mockDepositId} amount={sendAmount}
        token={receiveToken.symbol} railId="wallet" railName="Wallet" handle={walletAddress}
      />
    </div>
  );
}
