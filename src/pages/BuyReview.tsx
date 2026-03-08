import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { BorderBeam } from '@/components/ui/border-beam';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { getPaymentMethodById } from '@/components/shared/PaymentMethodPicker';
import { RailIcon } from '@/components/shared/RailIcon';
import { useAuth, truncateAddress, getDeliveryAddress } from '@/contexts/AuthContext';
import { orchestratorApi } from '@/lib/orchestratorApi';
import KineticDotsLoader from '@/components/ui/kinetic-dots-loader';

export default function BuyReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [confirmStep, setConfirmStep] = useState<'idle' | 'transitioning' | 'funding_escrow'>('idle');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const confirming = confirmStep !== 'idle';
  
  const state = location.state || {};
  const payAmount = state.payAmount || '100.00';
  const receiveAmount = state.receiveAmount || '99.50';
  const paymentMethodId = state.paymentMethod || 'venmo';
  const currency = state.currency || 'USD';
  const crypto = state.crypto || 'USDC';
  const intentId: string | undefined = state.intentId;
  
  const paymentMethod = getPaymentMethodById(paymentMethodId);
  const deliveryAddress = getDeliveryAddress(user);

  const handleConfirm = async () => {
    try {
      setConfirmError(null);
      let escrowId: string | undefined;
      let depositTxHash: string | undefined;

      if (intentId) {
        // Step 1: advance state to FUNDING
        setConfirmStep('transitioning');
        await orchestratorApi.transitionIntent(intentId, 'FUNDING');

        // Step 2: backend arbiter mints test USDC + creates + funds escrow
        setConfirmStep('funding_escrow');
        const payee = deliveryAddress || '0x0000000000000000000000000000000000000000';
        const result = await orchestratorApi.fundEscrow(intentId, payee);
        escrowId = result.escrowId;
        depositTxHash = result.depositTxHash;
      }

      navigate('/buy/complete', {
        state: {
          ...state,
          paymentMethod: paymentMethodId,
          escrowId,
          depositTxHash,
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to confirm';
      if (msg.toLowerCase().includes('insufficient funds') || msg.toLowerCase().includes('gas')) {
        setConfirmError('Insufficient Fuji AVAX for gas. Get testnet AVAX from the Avalanche Fuji faucet (faucet.avax.network) and try again.');
      } else {
        setConfirmError(msg);
      }
      setConfirmStep('idle');
    }
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
              <span className="text-muted-foreground">Rate (demo)</span>
              <span>1 USDC = $1.00 {currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">XRamp fee (0.5%)</span>
              <span>${(parseFloat(payAmount) * 0.005).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-medium">
              <span>Total</span>
              <span>${payAmount}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Settlement: Avalanche Fuji · USDC</span>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
          {paymentMethod && <RailIcon rail={paymentMethod.id} size={36} />}
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

        {/* LP funding notice */}
        <div className="flex items-center gap-2 p-3 bg-secondary/50 border border-border rounded-xl">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">XRamp LP funds escrow</span> — USDC is locked by the liquidity provider on Avalanche Fuji testnet. No wallet signature required from you.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
        <div className="max-w-md mx-auto space-y-2">
          {confirmError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{confirmError}</span>
            </div>
          )}
          {confirming && (
            <div className="flex items-center gap-2">
              <KineticDotsLoader dots={3} className="py-0" />
              <span className="text-xs text-muted-foreground">
                {confirmStep === 'transitioning' && 'Confirming intent…'}
                {confirmStep === 'funding_escrow' && 'XRamp LP funding escrow on Fuji…'}
              </span>
            </div>
          )}
          <InteractiveHoverButton
            text={confirming ? ' ' : 'Confirm buy'}
            onClick={handleConfirm}
            disabled={confirming}
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
