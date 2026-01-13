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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Sell() {
  const navigate = useNavigate();
  const { wallet, connectWallet, selectedCurrency, setSelectedCurrency, selectedCrypto, setSelectedCrypto } = useApp();
  
  const [sellAmount, setSellAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('venmo');
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [routePreference, setRoutePreference] = useState('best');

  const selectedMethod = getPaymentMethodById(payoutMethod);
  const numericAmount = parseFloat(sellAmount) || 0;

  const calculateReceive = (amount: string) => {
    const num = parseFloat(amount) || 0;
    if (num > 0) {
      const fee = num * 0.01;
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
    navigate('/sell/transfer', {
      state: {
        sellAmount,
        receiveAmount,
        payoutMethod,
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
            <h2 className="text-lg font-semibold text-foreground">Sell</h2>
          </div>

          {/* You sell */}
          <SwapInput
            label="You sell"
            value={sellAmount}
            onChange={(val) => {
              setSellAmount(val);
              calculateReceive(val);
            }}
            currency={selectedCrypto}
            onCurrencyChange={setSelectedCrypto}
            currencyType="crypto"
          />

          {/* Payout method */}
          <button
            onClick={() => setShowMethodPicker(true)}
            className="w-full rounded-xl p-4 bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Receive via</span>
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
            currency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            currencyType="fiat"
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
                    <span>XRamp fee (1%)</span>
                    <span>${(numericAmount * 0.01).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-foreground font-medium pt-2 border-t border-border">
                    <span>You'll receive</span>
                    <span>${receiveAmount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                    <Clock className="h-3 w-3" />
                    <span>Rate locks for 2:00</span>
                  </div>
                  
                  {/* Route preference */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Route</span>
                    <Select value={routePreference} onValueChange={setRoutePreference}>
                      <SelectTrigger className="w-auto h-7 text-xs bg-muted/50 border-0 gap-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="best">Best</SelectItem>
                        <SelectItem value="fastest">Fastest</SelectItem>
                        <SelectItem value="lowest">Lowest fee</SelectItem>
                      </SelectContent>
                    </Select>
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
            Sell crypto
            <br />
            <span className="text-primary">get paid fast</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto">
            Direct to Venmo, Cash App, Zelle & more.
          </p>
        </div>
      </div>

      {/* Payout Method Picker */}
      <PaymentMethodPicker
        open={showMethodPicker}
        onOpenChange={setShowMethodPicker}
        value={payoutMethod}
        onValueChange={setPayoutMethod}
        type="payout"
        amount={numericAmount}
        currency={selectedCurrency}
      />
    </div>
  );
}
