import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { SwapInput } from '@/components/shared/SwapInput';
import { QuotesCard } from '@/components/shared/QuotesCard';
import { TokenSelectorModal } from '@/components/shared/TokenSelectorModal';
import { PaymentMethodPicker, getPaymentMethodById } from '@/components/shared/PaymentMethodPicker';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { ChevronDown, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { RailIcon } from '@/components/shared/RailIcon';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { orchestratorApi } from '@/lib/orchestratorApi';
import KineticDotsLoader from '@/components/ui/kinetic-dots-loader';

export default function Buy() {
  const navigate = useNavigate();
  const { isAuthenticated, login, user } = useAuth();
  const { selectedCurrency, setSelectedCurrency, selectedCrypto, setSelectedCrypto } = useApp();

  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  const selectedMethod = paymentMethod ? getPaymentMethodById(paymentMethod) : null;
  const numericAmount = parseFloat(payAmount) || 0;

  // Temporary UI estimate until /quote is wired
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

      const { intent } = await orchestratorApi.createOnrampIntent({
        userId: getUserId(),
        amount: payAmount,
        sourceAsset: selectedCurrency,
        targetAsset: selectedCrypto,
        rail: paymentMethod ?? undefined,
      });

      navigate('/buy/review', {
        state: {
          payAmount,
          receiveAmount,
          paymentMethod,
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8 pb-32 md:pb-12">
      <div className="w-full max-w-md">
        <div className="relative bg-card border border-border rounded-2xl p-5 space-y-4 shadow-elevated animate-fade-in">
          <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
          <div className="mb-2">
            <h1 className="text-xl font-semibold text-foreground">Buy crypto</h1>
          </div>

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

          <div>
            <p className="text-sm text-muted-foreground mb-2">You receive</p>
            <SwapInput
              label=""
              value={receiveAmount}
              onChange={setReceiveAmount}
              currency={selectedCrypto}
              onCurrencyChange={(val) => { setSelectedCrypto(val); setShowTokenModal(true); }}
              currencyType="crypto"
              readOnly
              showEstimate={hasValidAmount}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-2">Sent to your delivery address.</p>
          </div>

          {/* Quotes card */}
          <QuotesCard
            payAmount={payAmount}
            payCurrency={selectedCurrency}
            receiveCrypto={selectedCrypto}
          />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Payment method</p>
            <button
              onClick={() => setShowMethodPicker(true)}
              className="w-full rounded-xl p-4 bg-secondary/50 hover:bg-secondary transition-colors text-left"
            >
              {selectedMethod ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RailIcon rail={selectedMethod.id} size={36} />
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
                    <span>${(numericAmount * 0.005).toFixed(2)}</span>
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

        {isSubmitting && (
          <div className="flex justify-center">
            <KineticDotsLoader dots={3} className="py-0" />
          </div>
        )}
        <div className="mt-4">
          <InteractiveHoverButton
            text={isSubmitting ? 'Matching LP…' : isAuthenticated ? 'Continue' : 'Log in to continue'}
            onClick={handleContinue}
            disabled={isSubmitting || (!canContinue && isAuthenticated)}
            className="w-full h-12 text-base rounded-xl border-primary/40 text-foreground"
          />
        </div>
      </div>

      <PaymentMethodPicker
        open={showMethodPicker}
        onOpenChange={setShowMethodPicker}
        value={paymentMethod || ''}
        onValueChange={setPaymentMethod}
        type="payment"
        amount={numericAmount}
        currency={selectedCurrency}
      />

      <TokenSelectorModal
        open={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onSelect={(sym) => { setSelectedCrypto(sym); }}
        selected={selectedCrypto}
      />
    </div>
  );
}
