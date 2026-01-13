import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type VerificationStatus = 'idle' | 'verifying' | 'verified';

export default function BuyVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<VerificationStatus>('idle');

  const state = location.state || {};
  const receiveAmount = state.receiveAmount || '99.50';
  const crypto = state.crypto || 'USDC';

  const handleVerify = () => {
    setStatus('verifying');
    // Simulate verification process
    setTimeout(() => {
      setStatus('verified');
    }, 2500);
  };

  const handleComplete = () => {
    navigate('/activity');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32 md:pb-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 animate-fade-in">
        {/* Icon */}
        <div className={cn(
          'h-16 w-16 mx-auto rounded-2xl flex items-center justify-center transition-all',
          status === 'verified' ? 'bg-success/10' : 'bg-primary/10'
        )}>
          {status === 'verifying' ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : status === 'verified' ? (
            <Check className="h-8 w-8 text-success" />
          ) : (
            <Shield className="h-8 w-8 text-primary" />
          )}
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">
            {status === 'idle' && 'Verify your payment'}
            {status === 'verifying' && 'Verifying...'}
            {status === 'verified' && 'Payment verified!'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {status === 'idle' && 'XRamp confirms your payment using a private proof. Your data stays on your device.'}
            {status === 'verifying' && 'This usually takes a few seconds.'}
            {status === 'verified' && `Your ${receiveAmount} ${crypto} is on the way.`}
          </p>
        </div>

        {/* Verification steps */}
        {status !== 'idle' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center',
                'bg-success/10'
              )}>
                <Check className="h-4 w-4 text-success" />
              </div>
              <span className="text-sm text-foreground">Payment detected</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center',
                status === 'verified' ? 'bg-success/10' : 'bg-muted'
              )}>
                {status === 'verified' ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                )}
              </div>
              <span className={cn('text-sm', status === 'verified' ? 'text-foreground' : 'text-muted-foreground')}>
                Generating proof
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center',
                status === 'verified' ? 'bg-success/10' : 'bg-muted'
              )}>
                {status === 'verified' ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                )}
              </div>
              <span className={cn('text-sm', status === 'verified' ? 'text-foreground' : 'text-muted-foreground')}>
                Settlement complete
              </span>
            </div>
          </div>
        )}

        {/* Privacy note */}
        {status === 'idle' && (
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">Privacy first:</span> Your payment details never leave your device. Only a cryptographic proof is shared.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
        <div className="max-w-md mx-auto">
          {status === 'idle' && (
            <Button
              variant="hero"
              className="w-full"
              onClick={handleVerify}
            >
              Verify now
            </Button>
          )}
          {status === 'verifying' && (
            <Button
              variant="hero"
              className="w-full"
              disabled
            >
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </Button>
          )}
          {status === 'verified' && (
            <Button
              variant="hero"
              className="w-full"
              onClick={handleComplete}
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
