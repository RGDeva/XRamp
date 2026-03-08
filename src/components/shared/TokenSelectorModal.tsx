import { useState } from 'react';
import { X, Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Token {
  symbol: string;
  name: string;
  chain: string;
  color: string;
  letter: string;
  popular?: boolean;
}

const TOKENS: Token[] = [
  { symbol: 'USDC',  name: 'USD Coin',            chain: 'Avalanche C-Chain', color: '#2775CA', letter: '$',  popular: true },
  { symbol: 'AVAX',  name: 'Avalanche',           chain: 'Avalanche C-Chain', color: '#E84142', letter: 'A',  popular: true },
  { symbol: 'USDT',  name: 'Tether',              chain: 'Avalanche C-Chain', color: '#26A17B', letter: '₮',  popular: true },
  { symbol: 'BTC.b', name: 'Bitcoin (Avalanche)', chain: 'Avalanche C-Chain', color: '#F7931A', letter: '₿',  popular: true },
  { symbol: 'WAVAX', name: 'Wrapped AVAX',        chain: 'Avalanche C-Chain', color: '#E84142', letter: 'W',  popular: true },
];

interface TokenSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  selected: string;
}

export function TokenSelectorModal({ open, onClose, onSelect, selected }: TokenSelectorModalProps) {
  const [tab, setTab] = useState<'popular' | 'az'>('popular');
  const [search, setSearch] = useState('');

  if (!open) return null;

  const filtered = TOKENS.filter(t =>
    (tab === 'popular' ? t.popular : true) &&
    (search === '' || t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => tab === 'az' ? a.symbol.localeCompare(b.symbol) : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Select token</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-3">
          {(['popular', 'az'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'popular' ? 'Popular' : 'A–Z'}
            </button>
          ))}
        </div>

        {/* Token list */}
        <div className="overflow-y-auto flex-1 px-3 pb-5">
          {filtered.map(token => (
            <button
              key={token.symbol}
              onClick={() => { onSelect(token.symbol); onClose(); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left',
                selected === token.symbol ? 'bg-primary/10' : 'hover:bg-secondary/50'
              )}
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: token.color }}
              >
                {token.letter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{token.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{token.name} · {token.chain}</p>
              </div>
              {selected === token.symbol && (
                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No tokens found</p>
          )}
        </div>
      </div>
    </div>
  );
}
