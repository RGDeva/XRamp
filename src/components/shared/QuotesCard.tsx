import { ArrowRight, ShieldCheck } from 'lucide-react';
import { CryptoIcon } from '@/components/shared/CryptoIcon';

interface QuotesCardProps {
  payAmount: string;
  payCurrency: string;
  receiveCrypto: string;
}

const PROTOCOL_FEE = 0.005; // 0.5%

export function QuotesCard({ payAmount, payCurrency, receiveCrypto }: QuotesCardProps) {
  const num = parseFloat(payAmount) || 0;

  if (num <= 0) return null;

  const feeAmt = num * PROTOCOL_FEE;
  const netOut = num - feeAmt;
  const displayToken = receiveCrypto || 'USDC';

  return (
    <div className="w-full rounded-2xl bg-card border border-border shadow-[0_4px_24px_rgba(0,0,0,0.18)] p-5 mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Escrow Quote
          </span>
        </div>
        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
          Fuji testnet
        </span>
      </div>

      {/* Main summary line */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-bold text-foreground">${num.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground font-medium">{payCurrency}</span>
        </div>

        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

        <div className="flex items-center gap-1.5">
          <CryptoIcon symbol={displayToken} size={22} />
          <span className="text-xl font-bold text-success">
            {netOut.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground font-medium">{displayToken}</span>
        </div>
      </div>

      {/* Detail rows */}
      <div className="space-y-2 border-t border-border/50 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Rate (demo)</span>
          <span className="font-medium text-foreground">1 {payCurrency} = 1.00 MockUSDC</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">XRamp fee (0.5%)</span>
          <span className="font-medium text-foreground">-${feeAmt.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-semibold border-t border-border/50 pt-2">
          <span className="text-foreground">You receive</span>
          <span className="text-success">{netOut.toFixed(2)} {displayToken}</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
        MockUSDC released from Fuji escrow after fiat payment verification. Rate is fixed 1:1 for demo.
      </p>
    </div>
  );
}
