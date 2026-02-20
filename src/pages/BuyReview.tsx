import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { BorderBeam } from '@/components/ui/border-beam';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ArrowLeft, Clock } from 'lucide-react';
import { getPaymentMethodById } from '@/components/shared/PaymentMethodPicker';
import { useAuth, truncateAddress, getDeliveryAddress } from '@/contexts/AuthContext';

export default function BuyReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const state = location.state || {};
  const payAmount = state.payAmount || '100.00';
  const receiveAmount = state.receiveAmount || '99.50';
  const paymentMethodId = state.paymentMethod || 'venmo';
  const currency = state.currency || 'USD';
  const crypto = state.crypto || 'USDC';
  
  const paymentMethod = getPaymentMethodById(paymentMethodId);
  const deliveryAddress = getDeliveryAddress(user);

  const handleConfirm = () => {
    navigate('/buy/complete', {
      state: {
        ...state,
        paymentMethod: paymentMethodId,
      }
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32 md:pb-8">
      <button
        onClick={() => navigate('/buy')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="relative bg-card border border-border rounded-2xl p-5 space-y-5 animate-fade-in overflow-hidden">
        <BorderBeam size={300} duration={10} />
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <h1 className="text-xl font-semibold">Review buy</h1>

        {/* Summary */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You pay</span>
            <span className="font-semibold numeral-display">${payAmount} {currency}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You receive</span>
            <span className="font-semibold numeral-display text-primary">{receiveAmount} {crypto}</span>
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
              <span>$0.12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">XRamp fee</span>
              <span>${(parseFloat(payAmount) * 0.005).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-medium">
              <span>Total</span>
              <span>${payAmount}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Rate lock</span>
              <span className="font-mono">00:28</span>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
            {paymentMethod?.icon}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{paymentMethod?.name}</p>
            <p className="text-xs text-muted-foreground">Payment method</p>
          </div>
        </div>

        {/* Destination */}
        {deliveryAddress && (
          <div className="p-4 bg-secondary/30 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Delivery address</p>
            <p className="font-mono text-sm">{truncateAddress(deliveryAddress)}</p>
          </div>
        )}

        {/* Compliance note */}
        <p className="text-xs text-muted-foreground text-center">
          Minimal data. Proof-based settlement. Verification may be required depending on method, region, or limits.
        </p>
      </div>

      {/* CTAs */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
        <div className="max-w-md mx-auto space-y-2">
          <InteractiveHoverButton
            text="Confirm buy"
            onClick={handleConfirm}
            className="w-full h-12 text-base rounded-xl border-primary/40 text-foreground"
          />
          <Button
            variant="ghost"
            className="w-full text-sm"
            size="sm"
            onClick={() => navigate('/buy')}
          >
            Change method
          </Button>
        </div>
      </div>
    </div>
  );
}
