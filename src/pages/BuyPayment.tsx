import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPaymentMethodById } from '@/components/shared/PaymentMethodPicker';

export default function BuyPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 59);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const state = location.state || {};
  const payAmount = state.payAmount || '100.00';
  const paymentMethodId = state.paymentMethod || 'venmo';
  const currency = state.currency || 'USD';
  
  const paymentMethod = getPaymentMethodById(paymentMethodId);

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

  // Generate payment details based on method
  const getPaymentDetails = () => {
    switch (paymentMethodId) {
      case 'venmo':
        return { handle: '@XRamp-Settlement', type: 'Venmo handle' };
      case 'cashapp':
        return { handle: '$XRampSettlement', type: 'Cash App tag' };
      case 'zelle':
        return { handle: 'payments@xramp.app', type: 'Zelle email' };
      case 'revolut':
        return { handle: '@xramp', type: 'Revolut tag' };
      case 'wise':
        return { handle: 'payments@xramp.app', type: 'Wise email' };
      default:
        return { handle: 'XRamp Settlement', type: 'Recipient' };
    }
  };

  const paymentDetails = getPaymentDetails();
  const referenceCode = 'XR-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const CopyButton = ({ field, value, primary = false }: { field: string; value: string; primary?: boolean }) => (
    <button
      onClick={() => handleCopy(field, value)}
      className={cn(
        'p-2 rounded-lg transition-colors',
        primary 
          ? copiedField === field ? 'bg-success/20' : 'bg-primary/20 hover:bg-primary/30'
          : 'hover:bg-muted'
      )}
    >
      {copiedField === field ? (
        <Check className={cn('h-4 w-4', primary ? 'text-success' : 'text-success')} />
      ) : (
        <Copy className={cn('h-4 w-4', primary ? 'text-primary' : 'text-muted-foreground')} />
      )}
    </button>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32 md:pb-8">
      <button
        onClick={() => navigate('/buy/confirm')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold mb-2">Complete your payment</h1>
          <div className="flex items-center gap-2 text-primary text-sm">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Transfer window</span>
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
            {paymentMethod?.icon}
          </div>
          <div>
            <p className="font-medium text-sm">Pay via {paymentMethod?.name}</p>
            <p className="text-xs text-muted-foreground">Follow the steps below</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-3">
          <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-xl font-semibold numeral-display">${payAmount} {currency}</p>
            </div>
            <CopyButton field="amount" value={`${payAmount}`} />
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{paymentDetails.type}</p>
              <p className="font-medium font-mono text-sm">{paymentDetails.handle}</p>
            </div>
            <CopyButton field="handle" value={paymentDetails.handle} />
          </div>

          {/* Reference Code - Prominent */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-primary font-medium mb-1">Reference code (required)</p>
                <p className="text-2xl font-bold font-mono tracking-wider text-primary">
                  {referenceCode}
                </p>
              </div>
              <CopyButton field="reference" value={referenceCode} primary />
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/20 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-warning">
            Include the reference code in your payment note or your order may be delayed.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
        <div className="max-w-md mx-auto space-y-2">
          <Button
            variant="hero"
            className="w-full"
            onClick={() => navigate('/buy/verify', { state: location.state })}
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
