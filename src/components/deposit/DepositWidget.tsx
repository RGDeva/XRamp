import { useState, useMemo } from 'react';
import { TrustwareProvider, TrustwareWidget } from '@trustware/sdk';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DepositModeSelector } from './DepositModeSelector';
import { AdvancedSettings } from './AdvancedSettings';
import {
  DepositMode,
  BASE_CHAIN_ID,
  USDC_BASE_ADDRESS,
  MERCHANT_WALLET_ADDRESS,
  XRAMP_TRUSTWARE_THEME,
  WIDGET_MESSAGES,
  TOKEN_OPTIONS,
  getEmbeddedWalletAddress,
} from './TrustwareConfig';

interface DepositWidgetProps {
  apiKey?: string;
  onGetStarted?: () => void;
}

export function DepositWidget({ apiKey = '', onGetStarted }: DepositWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<DepositMode>('swap');
  const [chain, setChain] = useState(BASE_CHAIN_ID);
  const [token, setToken] = useState(USDC_BASE_ADDRESS);
  const [slippage, setSlippage] = useState('1');

  const selectedToken = TOKEN_OPTIONS.find((t) => t.address === token);

  // Build Trustware config based on selected mode
  const trustwareConfig = useMemo(() => {
    // Build base routes config
    const routes: {
      toChain: string;
      toToken: string;
      toAddress?: string;
      defaultSlippage?: number;
    } = {
      toChain: chain,
      toToken: token,
      defaultSlippage: parseFloat(slippage),
    };

    // Set destination address based on mode
    switch (mode) {
      case 'embedded': {
        const embeddedAddress = getEmbeddedWalletAddress();
        if (embeddedAddress) {
          routes.toAddress = embeddedAddress;
        }
        break;
      }
      case 'payment':
        routes.toAddress = MERCHANT_WALLET_ADDRESS;
        break;
      // 'swap' mode: no toAddress, uses connected wallet
    }

    return {
      apiKey,
      routes,
      autoDetectProvider: mode !== 'swap',
      theme: XRAMP_TRUSTWARE_THEME,
      messages: WIDGET_MESSAGES,
    };
  }, [apiKey, mode, chain, token, slippage]);

  const getModeDescription = () => {
    switch (mode) {
      case 'swap':
        return 'Tokens will be sent to your connected wallet.';
      case 'embedded':
        return 'Tokens will be added to your XRamp balance.';
      case 'payment':
        return 'Tokens will be sent directly to the merchant.';
    }
  };

  return (
    <>
      {/* Hero Card Trigger */}
      <div className="inline-block bg-card border border-border rounded-2xl p-6 max-w-xs w-full shadow-elevated">
        <h3 className="text-left font-semibold mb-4">Deposit</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-input border border-border rounded-xl px-4 py-3">
            <div className="text-left">
              <p className="text-xs text-muted-foreground">You receive</p>
              <p className="text-lg font-mono text-foreground">{selectedToken?.symbol || 'USDC'} on Base</p>
            </div>
            {!onGetStarted && (
              <button
                onClick={() => setIsOpen(true)}
                className="text-xs text-primary hover:underline"
              >
                Change
              </button>
            )}
          </div>
          <Button
            variant="hero"
            className="w-full gap-2"
            onClick={onGetStarted ?? (() => setIsOpen(true))}
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Deposit Modal */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background border-border">
          <SheetHeader className="mb-4">
            <SheetTitle>Deposit</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-6rem)] pb-8">
            {/* Mode Selector */}
            <DepositModeSelector value={mode} onChange={setMode} />

            {/* Mode Description */}
            <p className="text-xs text-muted-foreground">{getModeDescription()}</p>

            {/* Trustware Widget */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <TrustwareProvider config={trustwareConfig}>
                <TrustwareWidget />
              </TrustwareProvider>
            </div>

            {/* Receive Summary */}
            <div className="flex items-center justify-between py-3 px-4 bg-secondary/30 rounded-xl">
              <span className="text-sm text-muted-foreground">You receive</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedToken?.symbol || 'USDC'} on Base</span>
                <button
                  onClick={() => {}}
                  className="text-xs text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Advanced Settings */}
            <AdvancedSettings
              chain={chain}
              token={token}
              slippage={slippage}
              onChainChange={setChain}
              onTokenChange={setToken}
              onSlippageChange={setSlippage}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
