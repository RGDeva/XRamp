import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Wallet, Check } from 'lucide-react';

export default function BuyConfirm() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-lg mx-auto px-4 py-8 pb-32 lg:pb-8">
      <button
        onClick={() => navigate('/buy')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="xramp-card animate-fade-in space-y-6">
        <h1 className="text-2xl font-semibold">Review & Pay</h1>

        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">You pay</span>
              <span className="font-semibold text-lg numeral-display">$100.00 USD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">You receive</span>
              <span className="font-semibold text-lg numeral-display text-primary">99.50 USDC</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between p-4 border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Apple Pay</p>
                <p className="text-sm text-muted-foreground">Payment method</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/buy')}
              className="text-sm text-primary hover:underline"
            >
              Change
            </button>
          </div>

          {/* Destination */}
          <div className="flex items-center justify-between p-4 border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium font-mono text-sm">0x1234...5678</p>
                <p className="text-sm text-muted-foreground">Destination wallet</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              <span>Proof-based settlement. Minimal data.</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              <span>Estimated arrival: ~10 minutes</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Some payment methods may require verification or have limits.
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 lg:bottom-8 left-0 right-0 p-4 lg:relative lg:p-0 lg:mt-6">
        <div className="container max-w-lg mx-auto space-y-3">
          <Button
            variant="hero"
            className="w-full"
            onClick={() => {
              // Simulate purchase completion
              navigate('/activity');
            }}
          >
            Complete Purchase
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/buy')}
          >
            Change payment method
          </Button>
        </div>
      </div>
    </div>
  );
}
