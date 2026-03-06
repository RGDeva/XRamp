import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { useAuth, truncateAddress, getDeliveryAddress } from '@/contexts/AuthContext';
import { txUrl } from '@/lib/fuji';

export default function BuyComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const state = location.state || {};
  const payAmount = state.payAmount || '100.00';
  const receiveAmount = state.receiveAmount || '99.50';
  const currency = state.currency || 'USD';
  const crypto = state.crypto || 'USDC';
  
  const deliveryAddress = getDeliveryAddress(user);

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32 md:pb-8">
      <div className="relative bg-card border border-border rounded-2xl p-6 space-y-6 animate-fade-in">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        {/* Success icon */}
        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center animate-success-pop">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Escrow funded</h1>
          <p className="text-muted-foreground text-sm">
            USDC has been locked in escrow on Fuji. Complete your fiat payment, then submit proof via the extension.
          </p>
        </div>

        {/* Details */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-sm">Paid</span>
            <span className="font-medium">
              $<AnimatedNumber value={parseFloat(payAmount) || 0} className="" /> {currency}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-sm">Receiving</span>
            <span className="font-medium text-primary">
              <AnimatedNumber value={parseFloat(receiveAmount) || 0} className="" /> {crypto}
            </span>
          </div>
          {deliveryAddress && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground text-sm">To</span>
              <span className="font-mono text-sm">{truncateAddress(deliveryAddress)}</span>
            </div>
          )}
          {state.intentId && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground text-sm">Intent ID</span>
              <span className="font-mono text-xs text-primary">{(state.intentId as string).slice(0, 12)}…</span>
            </div>
          )}
          {state.depositTxHash && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground text-sm">Deposit Tx</span>
              <a
                href={txUrl(state.depositTxHash as string)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs"
              >
                {(state.depositTxHash as string).slice(0, 8)}…{(state.depositTxHash as string).slice(-6)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {state.escrowId && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground text-sm">Escrow ID</span>
              <span className="font-mono text-xs">{state.escrowId as string}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-sm">Status</span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-sm text-primary font-medium">Awaiting fiat payment + proof</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pay via your selected method, then use the XRamp extension to submit payment proof. Admin will verify and release escrow.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
        <div className="max-w-md mx-auto space-y-2">
          <InteractiveHoverButton
            text="View activity"
            onClick={() => navigate('/activity')}
            className="w-full h-12 text-base rounded-xl border-primary/40 text-foreground"
          />
          <Button
            variant="ghost"
            className="w-full text-sm"
            size="sm"
            onClick={() => navigate('/')}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
