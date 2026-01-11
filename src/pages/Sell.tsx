import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AmountInput } from '@/components/shared/AmountInput';
import { PaymentMethodSelect } from '@/components/shared/PaymentMethodSelect';
import { SpeedToggle } from '@/components/shared/SpeedToggle';
import { QuoteBreakdown } from '@/components/shared/QuoteBreakdown';
import { useApp } from '@/contexts/AppContext';
import { Shield, ChevronDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export default function Sell() {
  const navigate = useNavigate();
  const { selectedCurrency, setSelectedCurrency, selectedCrypto, setSelectedCrypto } = useApp();
  
  const [sellAmount, setSellAmount] = useState('100');
  const [receiveAmount, setReceiveAmount] = useState('99.00');
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [speed, setSpeed] = useState<'standard' | 'instant'>('standard');
  const [routeOpen, setRouteOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<'best' | 'fastest' | 'lowest'>('best');

  const calculateReceive = (amount: string) => {
    const num = parseFloat(amount) || 0;
    const fee = num * 0.01; // 1% fee simulation
    setReceiveAmount((num - fee).toFixed(2));
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-8 pb-32 lg:pb-8">
      <div className="xramp-card animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Sell Crypto</h1>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
                <Shield className="h-3.5 w-3.5" />
                <span>Proof-based</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm font-medium mb-1">Proof-based settlement</p>
              <p className="text-xs text-muted-foreground">
                XRamp can verify certain transfers without uploading statements. Minimal data.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <AmountInput
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

        <AmountInput
          label="You receive"
          value={receiveAmount}
          onChange={setReceiveAmount}
          currency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
          currencyType="fiat"
          readOnly
          estimated
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Payout method</label>
          <PaymentMethodSelect
            value={payoutMethod}
            onValueChange={setPayoutMethod}
            type="payout"
          />
        </div>

        <SpeedToggle value={speed} onChange={setSpeed} />

        {/* Route Selection (Hidden by default) */}
        <Collapsible open={routeOpen} onOpenChange={setRouteOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            <span>Best route</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', routeOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex gap-2 pt-2">
              {(['best', 'fastest', 'lowest'] as const).map((route) => (
                <button
                  key={route}
                  onClick={() => setSelectedRoute(route)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                    selectedRoute === route
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {route === 'best' && 'Best'}
                  {route === 'fastest' && 'Fastest'}
                  {route === 'lowest' && 'Lowest fee'}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <QuoteBreakdown
          rate="1 USDC = $1.00"
          networkFee="$0.00"
          xrampFee="$1.00"
          total={`$${receiveAmount}`}
          rateLockExpiry={180}
        />

        <p className="text-xs text-muted-foreground text-center">
          Availability depends on region and provider.
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 lg:bottom-8 left-0 right-0 p-4 lg:relative lg:p-0 lg:mt-6">
        <div className="container max-w-lg mx-auto">
          <Button
            variant="hero"
            className="w-full"
            onClick={() => navigate('/sell/transfer')}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
