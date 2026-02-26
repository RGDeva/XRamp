import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { BorderBeam } from '@/components/ui/border-beam';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ArrowLeft, Clock } from 'lucide-react';
import { getPaymentMethodById } from '@/components/shared/PaymentMethodPicker';
import { RailIcon } from '@/components/shared/RailIcon';

export default function SellReview() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state || {};
  const sellAmount = state.sellAmount || '100';
  const receiveAmount = state.receiveAmount || '99.00';
  const payoutMethodId = state.payoutMethod || 'venmo';
  const payoutHandle = state.payoutHandle || '';
  const currency = state.currency || 'USD';
  const crypto = state.crypto || 'USDC';
  
  const payoutMethod = getPaymentMethodById(payoutMethodId);

  const handleConfirm = () => {
    navigate('/sell/complete', {
      state: {
        ...state,
        payoutMethod: payoutMethodId,
      }
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32 md:pb-8">
      <button
        onClick={() => navigate('/sell')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="relative bg-card border border-border rounded-2xl p-5 space-y-5 animate-fade-in overflow-hidden">
        <BorderBeam size={300} duration={10} colorFrom="hsl(185 80% 50%)" colorTo="hsl(142 70% 45%)" />
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <h1 className="text-xl font-semibold">Review sell</h1>

        {/* Summary */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You sell</span>
            <span className="font-semibold numeral-display">{sellAmount} {crypto}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You receive</span>
            <span className="font-semibold numeral-display text-primary">${receiveAmount} {currency}</span>
          </div>
        </div>

        {/* Quote details */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Quote details</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span>1 {crypto} = $1.00 {currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network fee</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">XRamp fee</span>
              <span>${(parseFloat(sellAmount) * 0.01).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-medium">
              <span>You receive</span>
              <span>${receiveAmount}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Rate lock</span>
              <span className="font-mono">00:28</span>
            </div>
          </div>
        </div>

        {/* Payout method */}
        <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
          {payoutMethod && <RailIcon rail={payoutMethod.id} size={36} />}
          <div className="flex-1">
            <p className="font-medium text-sm">{payoutMethod?.name}</p>
            {payoutHandle && (
              <p className="text-xs text-primary font-mono mt-0.5">{payoutHandle}</p>
            )}
            <p className="text-xs text-muted-foreground">Payout method</p>
          </div>
        </div>

        {/* Compliance note */}
        <p className="text-xs text-muted-foreground text-center">
          Minimal data. Proof-based settlement. Verification may be required depending on method, region, or limits.
        </p>
      </div>

      {/* CTAs */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
        <div className="max-w-md mx-auto space-y-2">
          <InteractiveHoverButton
            text="Confirm sell"
            onClick={handleConfirm}
            className="w-full h-12 text-base rounded-xl border-primary/40 text-foreground"
          />
          <Button
            variant="ghost"
            className="w-full text-sm"
            size="sm"
            onClick={() => navigate('/sell')}
          >
            Change method
          </Button>
        </div>
      </div>
    </div>
  );
}
