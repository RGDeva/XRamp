import { ArrowRight, Zap } from 'lucide-react';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import { cn } from '@/lib/utils';

interface QuotesCardProps {
  payAmount: string;
  payCurrency: string;
  receiveCrypto: string;
  rail?: string;
}

const PROTOCOL_FEE = 0.005; // 0.5%

export function QuotesCard({ payAmount, payCurrency, receiveCrypto, rail = 'Venmo' }: QuotesCardProps) {
  const num = parseFloat(payAmount) || 0;

  if (num <= 0) return null;

  const feeAmt = num * PROTOCOL_FEE;
  const netOut = num - feeAmt;
  const displayToken = receiveCrypto || 'USDC';

  return (
    <div className="w-full rounded-2xl bg-card border border-primary/20 shadow-[0_4px_24px_rgba(0,0,0,0.18)] p-4 mb-6 space-y-3">
      {/* Header: Best Quote badge + chain badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary fill-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
            Best Quote
          </span>
        </div>
        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
          Avalanche · Fuji testnet
        </span>
      </div>

      {/* Provider row */}
      <div className="flex items-center gap-2.5 py-1">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-black text-black">X</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">XRamp LP</span>
          <span className="text-xs text-muted-foreground ml-2">{rail} → USDC → Avalanche</span>
        </div>
        <span className={cn(
          'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full',
          'bg-success/15 text-success border border-success/30'
        )}>
          Live
        </span>
      </div>

      {/* Amount summary */}
      <div className="flex items-center gap-2 py-1 px-3 bg-secondary/40 rounded-xl">
        <div className="flex items-center gap-1">
          <span className="text-base font-bold text-foreground">${num.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{payCurrency}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mx-1" />
        <div className="flex items-center gap-1.5">
          <CryptoIcon symbol={displayToken} size={18} />
          <span className="text-base font-bold text-success">{netOut.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{displayToken}</span>
        </div>
      </div>

      {/* Detail rows */}
      <div className="space-y-1.5 border-t border-border/50 pt-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Rate</span>
          <span className="font-medium text-foreground">1 {payCurrency} = 1.00 USDC</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">XRamp fee (0.5%)</span>
          <span className="font-medium text-foreground">−${feeAmt.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-border/50 pt-1.5 font-semibold">
          <span className="text-foreground">You receive</span>
          <span className="text-success">{netOut.toFixed(2)} {displayToken}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Settlement</span>
          <span className="text-muted-foreground">Escrow → Avalanche Fuji</span>
        </div>
      </div>
    </div>
  );
}
