import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SwapInput } from '@/components/shared/SwapInput';
import { PaymentMethodSelect } from '@/components/shared/PaymentMethodSelect';
import { useApp } from '@/contexts/AppContext';
import { ArrowRight, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function Sell() {
  const navigate = useNavigate();
  const { wallet, selectedCurrency, setSelectedCurrency, selectedCrypto, setSelectedCrypto } = useApp();
  
  const [sellAmount, setSellAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('venmo');
  const [showDetails, setShowDetails] = useState(false);

  const calculateReceive = (amount: string) => {
    const num = parseFloat(amount) || 0;
    if (num > 0) {
      const fee = num * 0.01;
      setReceiveAmount((num - fee).toFixed(2));
    } else {
      setReceiveAmount('');
    }
  };

  const hasValidAmount = parseFloat(sellAmount) > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8">
      {/* Swap Card */}
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
          <PaymentMethodSelect
            value={payoutMethod}
            onValueChange={setPayoutMethod}
            type="payout"
          />

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
                  <span>~15 min delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>1 {selectedCrypto} = $1.00</span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showDetails && 'rotate-180')} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 pt-2 pb-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Network fee</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>XRamp fee (1%)</span>
                    <span>${(parseFloat(sellAmount) * 0.01).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-foreground font-medium pt-2 border-t border-border">
                    <span>You'll receive</span>
                    <span>${receiveAmount}</span>
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
            onClick={() => navigate('/sell/transfer')}
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

      {/* Learn more link */}
      <button className="mt-8 text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors animate-fade-in" style={{ animationDelay: '300ms' }}>
        Learn more
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
