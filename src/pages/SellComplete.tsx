import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { getPaymentMethodById } from '@/components/shared/PaymentMethodPicker';
import { txUrl } from '@/lib/fuji';

export default function SellComplete() {
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
          <h1 className="text-xl font-semibold">Your USDC is locked</h1>
          <p className="text-muted-foreground text-sm">
            Your wallet signed to lock USDC in escrow on Avalanche Fuji testnet. Awaiting buyer fiat payment proof and admin verification before release.
          </p>
          <span className="inline-flex mx-auto text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
            Avalanche Fuji testnet · USDC
          </span>
        </div>

        {/* Details */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-sm">Sold</span>
            <span className="font-medium">
              <AnimatedNumber value={parseFloat(sellAmount) || 0} className="" /> {crypto}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-sm">Receiving</span>
            <span className="font-medium text-primary">
              $<AnimatedNumber value={parseFloat(receiveAmount) || 0} className="" /> {currency}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-sm">Via</span>
            <div className="text-right">
              <span className="font-medium">{payoutMethod?.name}</span>
              {payoutHandle && (
                <p className="text-xs text-primary font-mono">{payoutHandle}</p>
              )}
            </div>
          </div>
          {state.intentId && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground text-sm">Intent ID</span>
              <span className="font-mono text-xs text-primary">{(state.intentId as string).slice(0, 12)}…</span>
            </div>
          )}
          {state.depositTxHash && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground text-sm">Escrow Deposit (Fuji)</span>
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
              <span className="text-sm text-primary font-medium">Awaiting proof + verification</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            After fiat payment is verified via the XRamp extension, admin releases USDC from escrow on Fuji.
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
