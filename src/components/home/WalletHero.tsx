import { Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

export function WalletHero() {
  const { connectWallet } = useApp();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-elevated animate-fade-in">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Welcome to XRamp</h1>
          <p className="text-muted-foreground">
            Connect your wallet to buy or sell crypto with minimal data.
          </p>
        </div>

        <Button 
          variant="hero" 
          size="lg" 
          onClick={connectWallet}
          className="w-full"
        >
          Connect Wallet
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <p className="text-xs text-muted-foreground">
          Proof-based settlement. Minimal data.
        </p>
      </div>

      <div className="text-center mt-10 space-y-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
          Buy & sell crypto
          <br />
          <span className="text-primary">privately</span>
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Direct to Venmo, Cash App, Zelle, Revolut & more.
        </p>
      </div>
    </div>
  );
}
