import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

export function BalanceCard() {
  const { wallet, privacyMode } = useApp();

  return (
    <div className="xramp-card animate-fade-in">
      <p className="text-sm font-medium text-muted-foreground mb-2">Total Balance</p>
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-muted-foreground">$</span>
        <span
          className={cn(
            'numeral-display text-5xl lg:text-6xl font-semibold text-foreground',
            privacyMode && 'privacy-blur'
          )}
        >
          {wallet.isConnected ? wallet.balance : '—'}
        </span>
        <span className="text-lg text-muted-foreground">USD</span>
      </div>
      {!wallet.isConnected && (
        <p className="text-sm text-muted-foreground mt-4">
          Connect your wallet to see your balance
        </p>
      )}
    </div>
  );
}
