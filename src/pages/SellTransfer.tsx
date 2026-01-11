import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SellTransfer() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 59);
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

  const CopyButton = ({ field, value }: { field: string; value: string }) => (
    <button
      onClick={() => handleCopy(field, value)}
      className="p-2 hover:bg-muted rounded-lg transition-colors"
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32 md:pb-8">
      <button
        onClick={() => navigate('/sell')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold mb-2">Transfer to complete</h1>
          <div className="flex items-center gap-2 text-primary text-sm">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Window active</span>
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Transfer Details */}
        <div className="space-y-3">
          <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-xl font-semibold numeral-display">{transferDetails.amount}</p>
            </div>
            <CopyButton field="amount" value={transferDetails.amount} />
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recipient</p>
              <p className="font-medium">{transferDetails.recipient}</p>
            </div>
            <CopyButton field="recipient" value={transferDetails.recipient} />
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Account</p>
              <p className="font-medium font-mono text-sm">{transferDetails.account}</p>
            </div>
            <CopyButton field="account" value={transferDetails.account} />
          </div>

          {/* Reference Code - Prominent */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-primary font-medium mb-1">Reference (required)</p>
                <p className="text-2xl font-bold font-mono tracking-wider text-primary">
                  {transferDetails.reference}
                </p>
              </div>
              <button
                onClick={() => handleCopy('reference', transferDetails.reference)}
                className={cn(
                  'p-3 rounded-lg transition-colors',
                  copiedField === 'reference' ? 'bg-success/20' : 'bg-primary/20 hover:bg-primary/30'
                )}
              >
                {copiedField === 'reference' ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <Copy className="h-5 w-5 text-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/20 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-warning">
            Include the reference code or your payout may be delayed.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
        <div className="max-w-md mx-auto space-y-2">
          <Button
            variant="hero"
            className="w-full"
            onClick={() => navigate('/activity')}
          >
            I've sent it
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-sm"
            size="sm"
          >
            <HelpCircle className="h-4 w-4" />
            Need help?
          </Button>
        </div>
      </div>
    </div>
  );
}
