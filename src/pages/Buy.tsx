import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SwapInput } from '@/components/shared/SwapInput';
import { PaymentMethodPicker, getPaymentMethodById } from '@/components/shared/PaymentMethodPicker';
import { useApp } from '@/contexts/AppContext';
import { ArrowRight, ChevronDown, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function Buy() {
  const navigate = useNavigate();
  const { wallet, connectWallet, selectedCurrency, setSelectedCurrency, selectedCrypto, setSelectedCrypto } = useApp();
  
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('venmo');
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const selectedMethod = getPaymentMethodById(paymentMethod);
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

  const handleContinue = () => {
    if (!wallet.isConnected) {
      connectWallet();
      return;
    }
    navigate('/buy/confirm', {
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-elevated animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">Buy</h2>
          </div>

          {/* You send */}
          <SwapInput
            label="You send"
            value={payAmount}
            onChange={(val) => {
              setPayAmount(val);
              calculateReceive(val);
            }}
            currency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            currencyType="fiat"
          />

          {/* Payment method */}
          <button
            onClick={() => setShowMethodPicker(true)}
            className="w-full rounded-xl p-4 bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Paying using</span>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-sm font-medium">
                  {selectedMethod?.icon}
                </div>
                <span className="font-medium">{selectedMethod?.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </button>

          {/* You receive */}
          <SwapInput
            label="You receive"
            value={receiveAmount}
            onChange={setReceiveAmount}
            currency={selectedCrypto}
            onCurrencyChange={setSelectedCrypto}
            currencyType="crypto"
            readOnly
            showEstimate={hasValidAmount}
          />

          {/* Quote details */}
          {hasValidAmount && (
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger className="w-full flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{selectedMethod?.eta} delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>1 {selectedCrypto} = $1.00</span>
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
                    <span>XRamp fee (0.5%)</span>
                    <span>${(numericAmount * 0.005).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Network fee</span>
                    <span>$0.12</span>
                  </div>
                  <div className="flex justify-between text-foreground font-medium pt-2 border-t border-border">
                    <span>Total</span>
                    <span>${payAmount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                    <Clock className="h-3 w-3" />
                    <span>Rate locks for 2:00</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* CTA */}
          <Button
            variant="hero"
            className="w-full mt-2"
            disabled={!hasValidAmount}
            onClick={handleContinue}
          >
            {wallet.isConnected ? 'Continue' : 'Connect Wallet'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Hero text below card */}
        <div className="text-center mt-10 space-y-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Buy crypto
            <br />
            <span className="text-primary">in 60 seconds</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto">
            Proof-based settlement. Minimal data.
          </p>
        </div>
      </div>

      {/* Payment Method Picker */}
      <PaymentMethodPicker
        open={showMethodPicker}
        onOpenChange={setShowMethodPicker}
        value={paymentMethod}
        onValueChange={setPaymentMethod}
        type="payment"
        amount={numericAmount}
        currency={selectedCurrency}
      />
    </div>
  );
}
