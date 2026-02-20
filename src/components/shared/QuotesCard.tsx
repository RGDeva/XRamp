import { ArrowRight, BadgeCheck } from 'lucide-react';
import { CryptoIcon } from '@/components/shared/CryptoIcon';

interface QuotesCardProps {
  payAmount: string;
  payCurrency: string;
  receiveCrypto: string;
}

// Future: replace with SDK queryDeposits({ rail: 'cashapp', minAmount: 20 }) to fetch best peer escrow rate
const BEST_ESCROW_RATE = 1.01; // USD per USDC — best available CashApp deposit, min $20
const PROTOCOL_FEE = 0.005;    // 0.5%

export function QuotesCard({ payAmount, payCurrency, receiveCrypto }: QuotesCardProps) {
  const num = parseFloat(payAmount) || 0;

  if (num <= 0) return null;

  // ZKP2P-style: out = amt * bestRate * (1 - fee)
  const grossOut = num * BEST_ESCROW_RATE;
  const feeAmt   = grossOut * PROTOCOL_FEE;
  const netOut   = grossOut - feeAmt;

  // Display token — always AVAX for this escrow quote per spec
  const displayToken = receiveCrypto || 'AVAX';

  return (
    <div className="w-full rounded-2xl bg-card border border-border shadow-[0_4px_24px_rgba(0,0,0,0.18)] p-5 mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Best Escrow Quote
          </span>
        </div>
        <span className="text-[10px] bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full font-medium">
          Peer rate
        </span>
      </div>

      {/* Main summary line */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* From */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-bold text-foreground">${num.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground font-medium">{payCurrency}</span>
        </div>

        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

        {/* To */}
        <div className="flex items-center gap-1.5">
          <CryptoIcon symbol={displayToken} size={22} />
          <span className="text-xl font-bold text-success">
            {netOut.toFixed(4)}
          </span>
          <span className="text-sm text-muted-foreground font-medium">{displayToken}</span>
        </div>
      </div>

      {/* Detail rows */}
      <div className="space-y-2 border-t border-border/50 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Escrow rate</span>
          <span className="font-medium text-foreground">
            1 USD = {BEST_ESCROW_RATE.toFixed(2)} USDC <span className="text-muted-foreground text-xs">(CashApp)</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Protocol fee (0.5%)</span>
          <span className="font-medium text-foreground">−${feeAmt.toFixed(4)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-semibold border-t border-border/50 pt-2">
          <span className="text-foreground">You receive</span>
          <span className="text-success">{netOut.toFixed(4)} {displayToken}</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
        {/* Future SDK: queryDeposits for best rail/amt — currently hardcoded at 1.01 from best CashApp escrow, min $20 */}
        Rate locked from best available peer escrow · min $20 · 0.5% protocol fee included
      </p>
    </div>
  );
}
