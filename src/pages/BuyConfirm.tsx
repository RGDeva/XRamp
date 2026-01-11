import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet, Check } from 'lucide-react';

export default function BuyConfirm() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32 md:pb-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5 animate-fade-in">
        <h1 className="text-xl font-semibold">Review & Pay</h1>

        {/* Summary */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You pay</span>
            <span className="font-semibold numeral-display">$100.00 USD</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You receive</span>
            <span className="font-semibold numeral-display text-primary">99.50 USDC</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
              V
            </div>
            <div>
              <p className="font-medium text-sm">Venmo</p>
              <p className="text-xs text-muted-foreground">Payment method</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-primary hover:underline"
          >
            Change
          </button>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-mono text-xs">0x1234...5678</p>
            <p className="text-xs text-muted-foreground">Destination wallet</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-success" />
            <span>Proof-based settlement. Minimal data.</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-success" />
            <span>Estimated arrival: ~10 minutes</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Some payment methods may require verification.
        </p>
      </div>

      {/* CTAs */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
        <div className="max-w-md mx-auto space-y-2">
          <Button
            variant="hero"
            className="w-full"
            onClick={() => navigate('/activity')}
          >
            Complete Purchase
          </Button>
          <Button
            variant="ghost"
            className="w-full text-sm"
            size="sm"
            onClick={() => navigate('/')}
          >
            Change payment method
          </Button>
        </div>
      </div>
    </div>
  );
}
