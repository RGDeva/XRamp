import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SwapInput } from '@/components/shared/SwapInput';
import { PaymentMethodPicker, getPaymentMethodById } from '@/components/shared/PaymentMethodPicker';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { ChevronDown, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function Buy() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const { selectedCurrency, setSelectedCurrency, selectedCrypto, setSelectedCrypto } = useApp();
  
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const selectedMethod = paymentMethod ? getPaymentMethodById(paymentMethod) : null;
  const numericAmount = parseFloat(payAmount) || 0;

  // Simulate quote calculation
  const calculateReceive = (amount: string) => {
    const num = parseFloat(amount) || 0;
    if (num > 0) {
      const fee = num * 0.005;
      setReceiveAmount((num - fee).toFixed(2));
    } else {
      setReceiveAmount('');
    }
  };

  const hasValidAmount = numericAmount > 0;
  const hasMethod = !!paymentMethod;
  const canContinue = hasValidAmount && hasMethod;

  const getValidationMessage = () => {
    if (!hasValidAmount) return 'Enter an amount';
    if (!hasMethod) return 'Select a payment method';
    if (!isAuthenticated) return 'Connect to continue';
    return null;
  };

  const handleContinue = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    if (!canContinue) return;
    
    navigate('/buy/review', {
      state: {
        payAmount,
        receiveAmount,
        paymentMethod,
        currency: selectedCurrency,
        crypto: selectedCrypto,
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8 pb-24 md:pb-8">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-elevated animate-fade-in">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-xl font-semibold text-foreground">Buy crypto</h1>
          </div>

          {/* You pay */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">You pay</p>
            <SwapInput
              label=""
              value={payAmount}
              onChange={(val) => {
                setPayAmount(val);
                calculateReceive(val);
              }}
              currency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
              currencyType="fiat"
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-2">Choose the currency you're paying with.</p>
          </div>

          {/* You receive */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">You receive</p>
            <SwapInput
              label=""
              value={receiveAmount}
              onChange={setReceiveAmount}
              currency={selectedCrypto}
              onCurrencyChange={setSelectedCrypto}
              currencyType="crypto"
              readOnly
              showEstimate={hasValidAmount}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-2">Sent to your delivery address.</p>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Payment method</p>
            <button
              onClick={() => setShowMethodPicker(true)}
              className="w-full rounded-xl p-4 bg-secondary/50 hover:bg-secondary transition-colors text-left"
            >
              {selectedMethod ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
                      {selectedMethod.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedMethod.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Limit ${selectedMethod.maxAmount.toLocaleString()} 
                        {selectedMethod.cooldown && ` • ${selectedMethod.cooldown}`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Choose a method</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Limits and availability depend on the payment platform.
            </p>
          </div>

          {/* Quote details */}
          {hasValidAmount && hasMethod && (
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger className="w-full flex items-center justify-between py-3 text-sm text-muted-foreground hover:text-foreground transition-colors border-t border-border">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{selectedMethod?.eta}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Quote details</span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showDetails && 'rotate-180')} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 pt-2 pb-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Rate</span>
                    <span>1 {selectedCrypto} = $1.00 {selectedCurrency}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Network fee</span>
                    <span>$0.12</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>XRamp fee</span>
                    <span>${(numericAmount * 0.005).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-foreground font-medium pt-2 border-t border-border">
                    <span>Total</span>
                    <span>${payAmount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                    <Clock className="h-3 w-3" />
                    <span>Rate lock 00:28</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Validation message */}
          {getValidationMessage() && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{getValidationMessage()}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
          <div className="max-w-md mx-auto">
            <Button
              variant="hero"
              className="w-full"
              disabled={!canContinue && isAuthenticated}
              onClick={handleContinue}
            >
              {isAuthenticated ? 'Continue' : 'Log in to continue'}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Method Picker */}
      <PaymentMethodPicker
        open={showMethodPicker}
        onOpenChange={setShowMethodPicker}
        value={paymentMethod || ''}
        onValueChange={setPaymentMethod}
        type="payment"
        amount={numericAmount}
        currency={selectedCurrency}
      />
    </div>
  );
}
