import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SellTransfer() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 59); // 14:59
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const transferDetails = {
    amount: '100.00 USDC',
    recipient: 'XRamp Settlement',
    account: 'xramp.base.eth',
    reference: 'XR-8A7F3B',
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-8 pb-32 lg:pb-8">
      <button
        onClick={() => navigate('/sell')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="xramp-card animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Transfer to complete</h1>
          <div className="flex items-center gap-2 text-primary">
            <Clock className="h-4 w-4 animate-pulse-cyan" />
            <span className="text-sm font-medium">Transfer window active</span>
            <span className="font-mono font-semibold text-lg">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Transfer Details */}
        <div className="space-y-4">
          {/* Amount */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Amount to transfer</p>
                <p className="text-2xl font-semibold numeral-display">{transferDetails.amount}</p>
              </div>
              <button
                onClick={() => handleCopy('amount', transferDetails.amount)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                {copiedField === 'amount' ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <Copy className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Recipient */}
          <div className="flex items-center justify-between p-4 border border-border rounded-xl">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Recipient</p>
              <p className="font-medium">{transferDetails.recipient}</p>
            </div>
            <button
              onClick={() => handleCopy('recipient', transferDetails.recipient)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {copiedField === 'recipient' ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <Copy className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Account */}
          <div className="flex items-center justify-between p-4 border border-border rounded-xl">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Account / Address</p>
              <p className="font-medium font-mono">{transferDetails.account}</p>
            </div>
            <button
              onClick={() => handleCopy('account', transferDetails.account)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {copiedField === 'account' ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <Copy className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Reference Code - Large and prominent */}
          <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary mb-1 font-medium">Reference code (REQUIRED)</p>
                <p className="text-3xl font-bold font-mono tracking-wider text-primary">
                  {transferDetails.reference}
                </p>
              </div>
              <button
                onClick={() => handleCopy('reference', transferDetails.reference)}
                className={cn(
                  'p-3 rounded-xl transition-colors',
                  copiedField === 'reference' ? 'bg-success/20' : 'bg-primary/20 hover:bg-primary/30'
                )}
              >
                {copiedField === 'reference' ? (
                  <Check className="h-6 w-6 text-success" />
                ) : (
                  <Copy className="h-6 w-6 text-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-warning">
            Include the reference code or your payout may be delayed.
          </p>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 lg:bottom-8 left-0 right-0 p-4 lg:relative lg:p-0 lg:mt-6">
        <div className="container max-w-lg mx-auto space-y-3">
          <Button
            variant="hero"
            className="w-full"
            onClick={() => navigate('/activity')}
          >
            I've sent it
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2"
            onClick={() => {
              // Open help modal or navigate to support
            }}
          >
            <HelpCircle className="h-4 w-4" />
            Need help?
          </Button>
        </div>
      </div>
    </div>
  );
}
