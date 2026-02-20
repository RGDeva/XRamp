import { useState } from 'react';
import { ArrowRight, ChevronDown, Info, CheckCircle2, Clock, ChevronRight, Wallet, History, LayoutList, X, Send as SendIcon, Shield } from 'lucide-react';
import { CryptoIcon, TOKENS } from '@/components/shared/CryptoIcon';
import { RailIcon, RAILS } from '@/components/shared/RailIcon';
import { SendSheet } from '@/components/deposits/SendSheet';
import KineticDotsLoader from '@/components/ui/kinetic-dots-loader';

type Tab = 'Buy' | 'Send';

const BUY_RAILS = [
  { id: 'venmo',   name: 'Venmo' },
  { id: 'cashapp', name: 'Cash App' },
  { id: 'wise',    name: 'Wise' },
];

const MOCK_QUEUE = [
  { id: 'q1', label: 'Waiting buyer', sub: 'Proof via agent', status: 'waiting', time: '2m ago' },
  { id: 'q2', label: 'Buyer matched', sub: 'Awaiting fiat proof', status: 'matched', time: '8m ago' },
  { id: 'q3', label: 'Completed', sub: '$50 released', status: 'done', time: '1h ago' },
];

export default function Ramp() {
  const [tab, setTab] = useState<Tab>('Buy');

  // Buy tab state
  const [usdAmount, setUsdAmount] = useState('100');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [selectedBuyRail, setSelectedBuyRail] = useState(BUY_RAILS[0].id);
  const [buyStep, setBuyStep] = useState<'form' | 'connecting'>('form');

  // Send tab state
  const [escrowAmount, setEscrowAmount] = useState('100');
  const [selectedSendToken, setSelectedSendToken] = useState(TOKENS[0]);
  const [showSendTokenPicker, setShowSendTokenPicker] = useState(false);
  const [selectedRail, setSelectedRail] = useState(RAILS[0]);
  const [handle, setHandle] = useState('');
  const [showSendSheet, setShowSendSheet] = useState(false);
  const [depositCreated, setDepositCreated] = useState(false);
  const [mockDepositId] = useState(Math.floor(3000 + Math.random() * 999));

  // Right panel
  const [panelOpen, setPanelOpen] = useState(true);

  // Derived quote values
  const usdNum = parseFloat(usdAmount) || 0;
  const tokenPrices: Record<string, number> = {
    AVAX: 28.5, ETH: 2650, SOL: 145, BASE: 2650, ARB: 0.92, USDC: 1,
  };
  const price = tokenPrices[selectedToken.symbol] ?? 1;
  const tokenAmount = usdNum > 0 ? (usdNum / price).toFixed(4) : '0';
  const fee = (usdNum * 0.005).toFixed(2);

  function handleBuyNow() {
    setBuyStep('connecting');
    setTimeout(() => setBuyStep('form'), 3000);
  }

  function handleCreateDeposit() {
    setDepositCreated(true);
    setShowSendSheet(true);
  }

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Collapsible panel toggle — fixed right edge */}
      <button
        onClick={() => setPanelOpen(v => !v)}
        className="fixed top-24 right-0 z-40 bg-card border border-border border-r-0 rounded-l-xl px-2 py-3 flex flex-col items-center gap-1 hover:bg-secondary transition-colors shadow-elevated"
        title={panelOpen ? 'Close panel' : 'Open panel'}
      >
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${panelOpen ? 'rotate-0' : 'rotate-180'}`} />
        <span className="text-[10px] text-muted-foreground font-medium [writing-mode:vertical-rl] tracking-widest uppercase">Panel</span>
      </button>

      {/* Right collapsible panel */}
      <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] z-30 flex flex-col bg-card/95 backdrop-blur-xl border-l border-border shadow-elevated transition-all duration-300 ease-in-out ${panelOpen ? 'w-72 translate-x-0' : 'w-72 translate-x-full'}`}>
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Account</span>
          <button onClick={() => setPanelOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Wallet balance */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Wallet Balance</div>
            <div className="bg-secondary border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Top up via bridge or direct transfer</span>
              </div>
              <div className="flex items-center gap-2">
                <CryptoIcon symbol="USDC" size={24} />
                <span className="text-2xl font-bold text-foreground">0.00</span>
                <span className="text-muted-foreground font-medium">USDC</span>
              </div>
              <button className="mt-3 w-full text-xs text-primary border border-primary/30 rounded-lg py-2 hover:bg-primary/10 transition-colors font-medium">
                + Add Funds
              </button>
            </div>
          </div>

          {/* Protocol tier */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Protocol Tier</div>
            <div className="bg-secondary border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-warning/20 border border-warning/30 flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-warning" />
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">Peer Peasant</div>
                <div className="text-xs text-warning">$0 – $500 volume</div>
              </div>
            </div>
          </div>

          {/* Active deposits */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Active Deposits</div>
            <div className="space-y-2">
              {[
                { id: 2428, token: 'USDC', taken: '6.69', rail: 'venmo' },
                { id: 2441, token: 'USDC', taken: '18.69', rail: 'cashapp' },
              ].map(dep => (
                <div key={dep.id} className="bg-secondary border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <CryptoIcon symbol={dep.token} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">#{dep.id}</div>
                    <div className="text-xs text-muted-foreground">${dep.taken} taken</div>
                  </div>
                  <RailIcon rail={dep.rail} size={20} />
                </div>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div className="border-t border-border pt-4 space-y-1">
            {[
              { icon: SendIcon,   label: 'Send',          action: () => setTab('Send') },
              { icon: History,    label: 'Order History',  action: () => {} },
              { icon: LayoutList, label: 'My Deposits',    action: () => {} },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content — shifts left when panel open on desktop */}
      <div className={`transition-all duration-300 ${panelOpen ? 'md:mr-72' : 'mr-0'}`}>
      <div className="max-w-lg mx-auto px-4 pt-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">xRamp</h1>
          <p className="text-muted-foreground text-base">Buy crypto or create a deposit listing</p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-0 mb-8 border-b border-border">
          {(['Buy', 'Send'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-8 py-3 text-lg font-semibold transition-all border-b-2 -mb-px ${
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── BUY TAB ── */}
        {tab === 'Buy' && (
          <div className="space-y-5">

            {/* Amount + Token */}
            <div className="xramp-card">
              <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">You Pay</label>
              <div className="flex gap-3 items-stretch">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl font-medium">$</span>
                  <input
                    type="number"
                    value={usdAmount}
                    onChange={e => setUsdAmount(e.target.value)}
                    placeholder="Enter USD"
                    className="w-full pl-9 pr-4 py-4 text-2xl font-bold text-foreground bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowTokenPicker(v => !v)}
                  className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-3 hover:border-primary/50 transition-all min-w-[120px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CryptoIcon symbol={selectedToken.symbol} size={32} />
                    <span className="font-bold text-foreground text-lg">{selectedToken.symbol}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Token picker dropdown */}
              {showTokenPicker && (
                <div className="mt-3 bg-card border border-border rounded-xl shadow-elevated overflow-hidden">
                  {TOKENS.map(token => (
                    <button
                      key={token.symbol}
                      onClick={() => { setSelectedToken(token); setShowTokenPicker(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors ${
                        selectedToken.symbol === token.symbol ? 'bg-secondary' : ''
                      }`}
                    >
                      <CryptoIcon symbol={token.symbol} size={36} />
                      <div className="text-left">
                        <div className="font-bold text-foreground">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">{token.network}</div>
                      </div>
                      {selectedToken.symbol === token.symbol && (
                        <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quotes preview card */}
            <div className="xramp-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Quote</span>
                <span className="text-xs bg-success/10 text-success border border-success/20 px-2 py-1 rounded-full font-medium">Safe ramp</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                ${usdAmount || '0'} = {tokenAmount} {selectedToken.symbol}
              </div>
              <div className="text-muted-foreground text-sm mb-4">1 {selectedToken.symbol} ≈ ${price.toLocaleString()}</div>
              <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>Fee (0.5%)</span>
                  <div className="relative group/tip">
                    <Info className="h-3.5 w-3.5 cursor-help" />
                    <div className="absolute bottom-5 left-0 bg-popover border border-border text-foreground text-xs rounded-lg px-3 py-2 w-48 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 shadow-elevated">
                      Small cost for exchange — covers network & service
                    </div>
                  </div>
                </div>
                <span className="font-semibold text-foreground">${fee}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-muted-foreground">You receive</span>
                <span className="font-bold text-success">{tokenAmount} {selectedToken.symbol}</span>
              </div>
            </div>

            {/* Rail mini-select */}
            <div className="xramp-card">
              <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Pay with</label>
              <div className="flex gap-3">
                {BUY_RAILS.map(rail => (
                  <button
                    key={rail.id}
                    onClick={() => setSelectedBuyRail(rail.id)}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                      selectedBuyRail === rail.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-secondary hover:border-primary/40'
                    }`}
                  >
                    <RailIcon rail={rail.id} size={36} />
                    <span className={`text-xs font-semibold ${selectedBuyRail === rail.id ? 'text-primary' : 'text-muted-foreground'}`}>
                      {rail.name}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                <span className="text-foreground font-medium">Venmo</span> = Fast US P2P &nbsp;·&nbsp;
                <span className="text-foreground font-medium">Wise</span> = International
              </p>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              {buyStep === 'connecting' && (
                <div className="xramp-card flex flex-col items-center py-2">
                  <KineticDotsLoader dots={4} className="py-2" />
                  <p className="text-primary text-sm font-semibold pb-4">Step 1/2: Connecting wallet…</p>
                </div>
              )}
              <div className="relative group/cta">
                <button
                  onClick={handleBuyNow}
                  disabled={!usdAmount || parseFloat(usdAmount) <= 0}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold text-xl py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-elevated"
                >
                  Buy Now
                  <ArrowRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border text-foreground text-xs rounded-lg px-3 py-2 w-56 text-center opacity-0 group-hover/cta:opacity-100 transition-opacity pointer-events-none z-10 shadow-elevated">
                  Sign to receive crypto — no upfront fee required
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SEND TAB ── */}
        {tab === 'Send' && (
          <div className="space-y-5">

            {/* Escrow amount + token */}
            <div className="xramp-card">
              <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Lock Amount</label>
              <div className="flex gap-3 items-stretch">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={escrowAmount}
                    onChange={e => setEscrowAmount(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-4 text-2xl font-bold text-foreground bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowSendTokenPicker(v => !v)}
                  className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-3 hover:border-primary/50 transition-all min-w-[120px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CryptoIcon symbol={selectedSendToken.symbol} size={32} />
                    <span className="font-bold text-foreground text-lg">{selectedSendToken.symbol}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {showSendTokenPicker && (
                <div className="mt-3 bg-card border border-border rounded-xl shadow-elevated overflow-hidden">
                  {TOKENS.map(token => (
                    <button
                      key={token.symbol}
                      onClick={() => { setSelectedSendToken(token); setShowSendTokenPicker(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors ${
                        selectedSendToken.symbol === token.symbol ? 'bg-secondary' : ''
                      }`}
                    >
                      <CryptoIcon symbol={token.symbol} size={36} />
                      <div className="text-left">
                        <div className="font-bold text-foreground">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">{token.network}</div>
                      </div>
                      {selectedSendToken.symbol === token.symbol && (
                        <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rail + handle combined */}
            <div className="xramp-card">
              <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Receive via</label>

              {/* Rail selector */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {RAILS.map(rail => (
                  <button
                    key={rail.id}
                    onClick={() => setSelectedRail(rail)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                      selectedRail.id === rail.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-secondary hover:border-primary/40'
                    }`}
                  >
                    <RailIcon rail={rail.id} size={28} />
                    <span className={`text-sm font-semibold ${selectedRail.id === rail.id ? 'text-primary' : 'text-muted-foreground'}`}>
                      {rail.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Handle input */}
              <div className="flex items-center gap-3 bg-secondary border border-border rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                <RailIcon rail={selectedRail.id} size={28} />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground font-medium mb-0.5">{selectedRail.tag}</div>
                  <input
                    type="text"
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    placeholder={selectedRail.placeholder}
                    className="w-full bg-transparent text-foreground font-semibold text-lg focus:outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
            </div>

            {/* Preview card */}
            <div className="xramp-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Deposit Preview</span>
                <div className="flex items-center gap-1 text-xs text-warning bg-warning/10 border border-warning/20 px-2 py-1 rounded-full">
                  <Clock className="h-3 w-3" /> 7d escrow
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                Lock {escrowAmount || '0'} {selectedSendToken.symbol}
              </div>
              <div className="text-muted-foreground text-sm mb-4">
                for USD fiat trades via {selectedRail.name} · 7-day safe escrow
              </div>
              <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-xl p-3">
                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground/80">
                  <strong className="text-primary">Escrow</strong> = Lock crypto safely, release only on fiat proof. Buyers contact you via chat.
                </p>
              </div>
            </div>

            {/* Send queue mock */}
            <div className="xramp-card">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Recent Activity</div>
              <div className="space-y-3">
                {MOCK_QUEUE.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                      item.status === 'done'    ? 'bg-success' :
                      item.status === 'matched' ? 'bg-primary' : 'bg-warning'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.sub}</div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="relative group/cta2">
              <button
                onClick={handleCreateDeposit}
                disabled={!escrowAmount || parseFloat(escrowAmount) <= 0 || !handle.trim()}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold text-xl py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-elevated"
              >
                Create Deposit
                <ArrowRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border text-foreground text-xs rounded-lg px-3 py-2 w-56 text-center opacity-0 group-hover/cta2:opacity-100 transition-opacity pointer-events-none z-10 shadow-elevated">
                Buyers contact you via chat for fiat — Listed! Share QR after creation
              </div>
            </div>

            {depositCreated && !showSendSheet && (
              <button
                onClick={() => setShowSendSheet(true)}
                className="w-full border border-primary text-primary font-semibold py-3 rounded-2xl hover:bg-primary/10 transition-all"
              >
                Share deposit link again
              </button>
            )}
          </div>
        )}
      </div>

        {/* SendSheet */}
        <SendSheet
          open={showSendSheet}
          onClose={() => setShowSendSheet(false)}
          depositId={mockDepositId}
          amount={escrowAmount}
          token={selectedSendToken.symbol}
          railId={selectedRail.id}
          railName={selectedRail.name}
          handle={handle}
        />
      </div>{/* end md:mr-72 wrapper */}
    </div>
  );
}
