import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useAuth, truncateAddress, getDeliveryAddress } from '@/contexts/AuthContext';

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
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 animate-fade-in">
        {/* Success icon */}
        <div className="h-16 w-16 mx-auto rounded-2xl bg-success/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-success" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Order received</h1>
          <p className="text-muted-foreground text-sm">
            Your crypto is being delivered to your address.
          </p>
        </div>

        {/* Details */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-sm">Paid</span>
            <span className="font-medium">${payAmount} {currency}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-sm">Receiving</span>
            <span className="font-medium text-primary">{receiveAmount} {crypto}</span>
          </div>
          {deliveryAddress && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground text-sm">To</span>
              <span className="font-mono text-sm">{truncateAddress(deliveryAddress)}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-sm">Status</span>
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-sm text-primary font-medium">Processing</span>
            </div>
          </div>
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
            View activity
          </Button>
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
