import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AmountInput } from '@/components/shared/AmountInput';
import { PaymentMethodSelect } from '@/components/shared/PaymentMethodSelect';
import { SpeedToggle } from '@/components/shared/SpeedToggle';
import { QuoteBreakdown } from '@/components/shared/QuoteBreakdown';
import { useApp } from '@/contexts/AppContext';
import { Copy, Check, Shield } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Buy() {
  const navigate = useNavigate();
  const { wallet, selectedCurrency, setSelectedCurrency, selectedCrypto, setSelectedCrypto } = useApp();
  
  const [payAmount, setPayAmount] = useState('100');
  const [receiveAmount, setReceiveAmount] = useState('99.50');
  const [paymentMethod, setPaymentMethod] = useState('apple-pay');
  const [speed, setSpeed] = useState<'standard' | 'instant'>('standard');
  const [destinationAddress, setDestinationAddress] = useState(wallet.address || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (destinationAddress) {
      navigator.clipboard.writeText(destinationAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Simulate quote calculation
  const calculateReceive = (amount: string) => {
    const num = parseFloat(amount) || 0;
    const fee = num * 0.005; // 0.5% fee simulation
    setReceiveAmount((num - fee).toFixed(2));
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-8 pb-32 lg:pb-8">
      <div className="xramp-card animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Buy Crypto</h1>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
                <Shield className="h-3.5 w-3.5" />
                <span>Proof-based</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm font-medium mb-1">Proof-based verification</p>
              <p className="text-xs text-muted-foreground">
                XRamp can verify certain transfers without uploading statements. Minimal data.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <AmountInput
          label="You pay"
          value={payAmount}
          onChange={(val) => {
            setPayAmount(val);
            calculateReceive(val);
          }}
          currency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
          currencyType="fiat"
        />

        <AmountInput
          label="You receive"
          value={receiveAmount}
          onChange={setReceiveAmount}
          currency={selectedCrypto}
          onCurrencyChange={setSelectedCrypto}
          currencyType="crypto"
          readOnly
          estimated
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Payment method</label>
          <PaymentMethodSelect
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            type="payment"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Destination</label>
          <div className="relative">
            <input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="Wallet address"
              className="xramp-input w-full pr-10 font-mono text-sm"
            />
            {destinationAddress && (
              <button
                onClick={handleCopy}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            )}
          </div>
          {wallet.isConnected && !destinationAddress && (
            <button
              onClick={() => setDestinationAddress(wallet.address || '')}
              className="text-xs text-primary hover:underline"
            >
              Use connected wallet
            </button>
          )}
        </div>

        <SpeedToggle value={speed} onChange={setSpeed} />

        <QuoteBreakdown
          rate="1 USDC = $1.00"
          networkFee="$0.12"
          xrampFee="$0.38"
          total={`$${payAmount}`}
          rateLockExpiry={120}
        />

        <p className="text-xs text-muted-foreground text-center">
          Some payment methods may require verification or have limits.
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 lg:bottom-8 left-0 right-0 p-4 lg:relative lg:p-0 lg:mt-6">
        <div className="container max-w-lg mx-auto">
          <Button
            variant="hero"
            className="w-full"
            onClick={() => navigate('/buy/confirm')}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
