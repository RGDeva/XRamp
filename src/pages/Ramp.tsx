import { useState } from 'react';
import { ArrowRight, ChevronDown, Info, CheckCircle2, Clock } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">xRamp</h1>
          <p className="text-gray-500 text-base">Buy crypto or create a deposit listing</p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-0 mb-8 border-b border-gray-200">
          {(['Buy', 'Send'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-8 py-3 text-lg font-semibold transition-all border-b-2 -mb-px ${
                tab === t
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
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
            <div className="bg-white rounded-2xl shadow-md p-6">
              <label className="block text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">You Pay</label>
              <div className="flex gap-3 items-stretch">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-medium">$</span>
                  <input
                    type="number"
                    value={usdAmount}
                    onChange={e => setUsdAmount(e.target.value)}
                    placeholder="Enter USD"
                    className="w-full pl-9 pr-4 py-4 text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <button
                  onClick={() => setShowTokenPicker(v => !v)}
                  className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 hover:border-blue-300 transition-colors min-w-[120px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CryptoIcon symbol={selectedToken.symbol} size={32} />
                    <span className="font-bold text-gray-900 text-lg">{selectedToken.symbol}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Token picker dropdown */}
              {showTokenPicker && (
                <div className="mt-3 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {TOKENS.map(token => (
                    <button
                      key={token.symbol}
                      onClick={() => { setSelectedToken(token); setShowTokenPicker(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                        selectedToken.symbol === token.symbol ? 'bg-blue-50' : ''
                      }`}
                    >
                      <CryptoIcon symbol={token.symbol} size={36} />
                      <div className="text-left">
                        <div className="font-bold text-gray-900">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.network}</div>
                      </div>
                      {selectedToken.symbol === token.symbol && (
                        <CheckCircle2 className="h-4 w-4 text-blue-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quotes preview card */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quote</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Safe ramp</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                ${usdAmount || '0'} = {tokenAmount} {selectedToken.symbol}
              </div>
              <div className="text-gray-400 text-sm mb-4">1 {selectedToken.symbol} ≈ ${price.toLocaleString()}</div>
              <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1 text-gray-500">
                  <span>Fee (0.5%)</span>
                  <div className="relative group">
                    <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                    <div className="absolute bottom-5 left-0 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Small cost for exchange — covers network & service
                    </div>
                  </div>
                </div>
                <span className="font-semibold text-gray-700">${fee}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-gray-500">You receive</span>
                <span className="font-bold text-green-600">{tokenAmount} {selectedToken.symbol}</span>
              </div>
            </div>

            {/* Rail mini-select */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <label className="block text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Pay with</label>
              <div className="flex gap-3">
                {BUY_RAILS.map(rail => (
                  <button
                    key={rail.id}
                    onClick={() => setSelectedBuyRail(rail.id)}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                      selectedBuyRail === rail.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <RailIcon rail={rail.id} size={36} />
                    <span className={`text-xs font-semibold ${selectedBuyRail === rail.id ? 'text-blue-600' : 'text-gray-500'}`}>
                      {rail.name}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                <span className="font-medium">Venmo</span> = Fast US P2P pay &nbsp;·&nbsp;
                <span className="font-medium">Wise</span> = International transfers
              </p>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              {buyStep === 'connecting' && (
                <div className="bg-white rounded-2xl shadow-md flex flex-col items-center py-2">
                  <KineticDotsLoader dots={4} className="py-2" />
                  <p className="text-blue-600 text-sm font-semibold pb-4">Step 1/2: Connecting wallet…</p>
                </div>
              )}
              <div className="relative group">
                <button
                  onClick={handleBuyNow}
                  disabled={!usdAmount || parseFloat(usdAmount) <= 0}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xl py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg"
                >
                  Buy Now
                  <ArrowRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-56 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
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
            <div className="bg-white rounded-2xl shadow-md p-6">
              <label className="block text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Lock Amount</label>
              <div className="flex gap-3 items-stretch">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={escrowAmount}
                    onChange={e => setEscrowAmount(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-4 text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <button
                  onClick={() => setShowSendTokenPicker(v => !v)}
                  className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 hover:border-blue-300 transition-colors min-w-[120px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CryptoIcon symbol={selectedSendToken.symbol} size={32} />
                    <span className="font-bold text-gray-900 text-lg">{selectedSendToken.symbol}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {showSendTokenPicker && (
                <div className="mt-3 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {TOKENS.map(token => (
                    <button
                      key={token.symbol}
                      onClick={() => { setSelectedSendToken(token); setShowSendTokenPicker(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                        selectedSendToken.symbol === token.symbol ? 'bg-blue-50' : ''
                      }`}
                    >
                      <CryptoIcon symbol={token.symbol} size={36} />
                      <div className="text-left">
                        <div className="font-bold text-gray-900">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.network}</div>
                      </div>
                      {selectedSendToken.symbol === token.symbol && (
                        <CheckCircle2 className="h-4 w-4 text-blue-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rail + handle combined */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <label className="block text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Receive via</label>

              {/* Rail selector */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {RAILS.map(rail => (
                  <button
                    key={rail.id}
                    onClick={() => setSelectedRail(rail)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                      selectedRail.id === rail.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <RailIcon rail={rail.id} size={28} />
                    <span className={`text-sm font-semibold ${selectedRail.id === rail.id ? 'text-blue-600' : 'text-gray-600'}`}>
                      {rail.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Handle input */}
              <div className="flex items-center gap-3 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus-within:border-blue-400 transition-colors">
                <RailIcon rail={selectedRail.id} size={28} />
                <div className="flex-1">
                  <div className="text-xs text-gray-400 font-medium mb-0.5">{selectedRail.tag}</div>
                  <input
                    type="text"
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    placeholder={selectedRail.placeholder}
                    className="w-full bg-transparent text-gray-900 font-semibold text-lg focus:outline-none placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Preview card */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Deposit Preview</span>
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  <Clock className="h-3 w-3" /> 7d escrow
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                Lock {escrowAmount || '0'} {selectedSendToken.symbol}
              </div>
              <div className="text-gray-500 text-sm mb-4">
                for USD fiat trades via {selectedRail.name} · 7-day safe escrow
              </div>
              <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  <strong>Escrow</strong> = Lock crypto safely, release only on fiat proof. Buyers contact you via chat.
                </p>
              </div>
            </div>

            {/* Send queue mock */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Recent Activity</div>
              <div className="space-y-3">
                {MOCK_QUEUE.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                      item.status === 'done' ? 'bg-green-500' :
                      item.status === 'matched' ? 'bg-blue-500' : 'bg-amber-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.sub}</div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="relative group">
              <button
                onClick={handleCreateDeposit}
                disabled={!escrowAmount || parseFloat(escrowAmount) <= 0 || !handle.trim()}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xl py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg"
              >
                Create Deposit
                <ArrowRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-56 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Buyers contact you via chat for fiat — Listed! Share QR after creation
              </div>
            </div>

            {depositCreated && !showSendSheet && (
              <button
                onClick={() => setShowSendSheet(true)}
                className="w-full border-2 border-green-500 text-green-600 font-semibold py-3 rounded-2xl hover:bg-green-50 transition-colors"
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
    </div>
  );
}
