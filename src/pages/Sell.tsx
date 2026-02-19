import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
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
import { orchestratorApi } from '@/lib/orchestratorApi';

export default function Sell() {
  const navigate = useNavigate();
  const { isAuthenticated, login, user } = useAuth();
  const { selectedCurrency, setSelectedCurrency, selectedCrypto, setSelectedCrypto } = useApp();

  const [sellAmount, setSellAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<string | null>(null);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedMethod = payoutMethod ? getPaymentMethodById(payoutMethod) : null;
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
  const hasMethod = !!payoutMethod;
  const canContinue = hasValidAmount && hasMethod;

  const getValidationMessage = () => {
    if (!hasValidAmount) return 'Enter an amount';
    if (!hasMethod) return 'Select a payout method';
    if (!isAuthenticated) return 'Connect to continue';
    return null;
  };

  const getUserId = () => user?.email || user?.walletAddress || user?.embeddedWalletAddress || 'guest';

  const handleContinue = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    if (!canContinue) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const { intent } = await orchestratorApi.createOfframpIntent({
        userId: getUserId(),
        amount: sellAmount,
        sourceAsset: selectedCrypto,
        targetAsset: selectedCurrency,
      });

      navigate('/sell/review', {
        state: {
          sellAmount,
          receiveAmount,
          payoutMethod,
          currency: selectedCurrency,
          crypto: selectedCrypto,
          intentId: intent.id,
        },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create intent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8 pb-24 md:pb-8">
      <div className="w-full max-w-md">
        <div className="relative bg-card border border-border rounded-2xl p-5 space-y-4 shadow-elevated animate-fade-in overflow-hidden shimmer-sweep">
          <div className="mb-2">
            <h1 className="text-xl font-semibold text-foreground">Sell crypto</h1>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">You sell</p>
            <SwapInput
              label=""
              value={sellAmount}
              onChange={(val) => {
                setSellAmount(val);
                calculateReceive(val);
              }}
              currency={selectedCrypto}
              onCurrencyChange={setSelectedCrypto}
              currencyType="crypto"
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-2">We'll show a quote before you confirm.</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">You receive</p>
            <SwapInput
              label=""
              value={receiveAmount}
              onChange={setReceiveAmount}
              currency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
              currencyType="fiat"
              readOnly
              showEstimate={hasValidAmount}
              placeholder="0"
            />
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Payout method</p>
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
          </div>

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
                    <span>XRamp fee</span>
                    <span>${(numericAmount * 0.01).toFixed(2)}</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {(getValidationMessage() || submitError) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{submitError || getValidationMessage()}</span>
            </div>
          )}
        </div>

        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
          <div className="max-w-md mx-auto">
            <InteractiveHoverButton
              text={isSubmitting ? 'Creating intent…' : isAuthenticated ? 'Continue' : 'Log in to continue'}
              onClick={handleContinue}
              disabled={isSubmitting || (!canContinue && isAuthenticated)}
              className="w-full h-12 text-base rounded-xl border-primary/40 text-foreground"
            />
          </div>
        </div>
      </div>

      <PaymentMethodPicker
        open={showMethodPicker}
        onOpenChange={setShowMethodPicker}
        value={payoutMethod || ''}
        onValueChange={setPayoutMethod}
        type="payout"
        amount={numericAmount}
        currency={selectedCurrency}
      />
    </div>
  );
}
