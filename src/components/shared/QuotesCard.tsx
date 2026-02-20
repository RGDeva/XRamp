import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface QuotesCardProps {
  payAmount: string;
  payCurrency: string;
  receiveCrypto: string;
}

const MOCK_RATES: Record<string, { rate: number; symbol: string }> = {
  ETH:   { rate: 0.000415, symbol: '⟠' },
  AVAX:  { rate: 0.0653,   symbol: 'A' },
  SOL:   { rate: 0.00617,  symbol: '◎' },
  USDC:  { rate: 0.995,    symbol: '$' },
  BASE:  { rate: 0.000415, symbol: 'B' },
  HYPE:  { rate: 0.0512,   symbol: 'H' },
  BTC:   { rate: 0.0000107,symbol: '₿' },
  MATIC: { rate: 1.23,     symbol: 'M' },
  ARB:   { rate: 0.892,    symbol: 'A' },
  LINK:  { rate: 0.0671,   symbol: 'L' },
};

export function QuotesCard({ payAmount, payCurrency, receiveCrypto }: QuotesCardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const num = parseFloat(payAmount) || 0;
  const rateInfo = MOCK_RATES[receiveCrypto] ?? { rate: 1, symbol: '?' };
  const receiveAmt = (num * rateInfo.rate).toFixed(6);
  const feeAmt = (num * 0.005).toFixed(2);
  const rateDisplay = (1 / rateInfo.rate).toFixed(2);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  if (num <= 0) return null;

  return (
    <div className="rounded-xl bg-secondary/30 border border-border/50 p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quote</span>
        <button
          onClick={handleRefresh}
          className="p-1 rounded-md hover:bg-secondary transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">You get</span>
        <span className="text-sm font-semibold text-foreground">
          {receiveAmt} {receiveCrypto}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Rate</span>
        <span className="text-sm text-muted-foreground">
          1 {receiveCrypto} = ${rateDisplay} {payCurrency}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">XRamp fee</span>
        <span className="text-sm text-muted-foreground">
          ${feeAmt} (0.5%)
        </span>
      </div>

      <div className="border-t border-border/50 pt-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total cost</span>
        <span className="text-sm font-semibold text-foreground">
          ${(num + parseFloat(feeAmt)).toFixed(2)} {payCurrency}
        </span>
      </div>
    </div>
  );
}
