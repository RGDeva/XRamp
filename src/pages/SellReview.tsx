import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { BorderBeam } from '@/components/ui/border-beam';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ArrowLeft, Clock, AlertCircle, Wallet } from 'lucide-react';
import { getPaymentMethodById } from '@/components/shared/PaymentMethodPicker';
import { RailIcon } from '@/components/shared/RailIcon';
import { useAuth, getDeliveryAddress } from '@/contexts/AuthContext';
import { orchestratorApi } from '@/lib/orchestratorApi';
import { createAndFundEscrow, mintTestUsdc, MOCK_USDC_ADDRESS } from '@/lib/fuji';
import KineticDotsLoader from '@/components/ui/kinetic-dots-loader';

export default function SellReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getWalletSigner } = useAuth();
  const [confirmStep, setConfirmStep] = useState<'idle' | 'transitioning' | 'minting' | 'creating_escrow' | 'approving' | 'depositing' | 'reporting'>('idle');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const confirming = confirmStep !== 'idle';
  
  const state = location.state || {};
  const sellAmount = state.sellAmount || '100';
  const receiveAmount = state.receiveAmount || '99.00';
  const payoutMethodId = state.payoutMethod || 'venmo';
  const payoutHandle = state.payoutHandle || '';
  const currency = state.currency || 'USD';
  const crypto = state.crypto || 'USDC';
  const intentId: string | undefined = state.intentId;
  
  const payoutMethod = getPaymentMethodById(payoutMethodId);

  const deliveryAddress = getDeliveryAddress(user);

  const handleConfirm = async () => {
    try {
      setConfirmError(null);
      let escrowId: string | undefined;
      let depositTxHash: string | undefined;

      if (intentId) {
        // Step 1: advance state to FUNDING
        setConfirmStep('transitioning');
        await orchestratorApi.transitionIntent(intentId, 'FUNDING');

        // Step 2: get signer (resolves wallet, switches to Fuji — no popup yet)
        const signer = await getWalletSigner();
        const signerAddress = await signer.getAddress();
        const amount = ethers.parseUnits(sellAmount, 6);
        const payee = deliveryAddress || signerAddress;

        // Step 3: mint test USDC → wallet popup #1
        setConfirmStep('minting');
        await mintTestUsdc(signer, signerAddress, amount);

        // Step 4: createEscrow → wallet popup #2
        setConfirmStep('creating_escrow');
        const result = await createAndFundEscrow(
          signer,
          MOCK_USDC_ADDRESS,
          amount,
          signerAddress,
          payee,
          (step) => {
            if (step === 'creating') setConfirmStep('creating_escrow');
            if (step === 'approving') setConfirmStep('approving');
            if (step === 'depositing') setConfirmStep('depositing');
          },
        );
        escrowId = result.escrowId;
        depositTxHash = result.depositTxHash;

        // Step 5: report funding to backend
        setConfirmStep('reporting');
        await orchestratorApi.reportFunding(intentId, {
          escrowId,
          depositTxHash,
          payer: signerAddress,
          payee,
        });
      }

      navigate('/sell/complete', {
        state: {
          ...state,
          payoutMethod: payoutMethodId,
          escrowId,
          depositTxHash,
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to confirm';
      if (msg.toLowerCase().includes('insufficient funds') || msg.toLowerCase().includes('gas')) {
        setConfirmError('Insufficient Fuji AVAX for gas. Get testnet AVAX from the Avalanche Fuji faucet (faucet.avax.network) and try again.');
      } else {
        setConfirmError(msg);
      }
      setConfirmStep('idle');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32 md:pb-8">
      <button
        onClick={() => navigate('/sell')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="relative bg-card border border-border rounded-2xl p-5 space-y-5 animate-fade-in overflow-hidden">
        <BorderBeam size={300} duration={10} colorFrom="hsl(185 80% 50%)" colorTo="hsl(142 70% 45%)" />
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <h1 className="text-xl font-semibold">Review sell</h1>

        {/* Summary */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You sell</span>
            <span className="font-semibold numeral-display">{sellAmount} {crypto}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You receive</span>
            <span className="font-semibold numeral-display text-primary">${receiveAmount} {currency}</span>
          </div>
        </div>

        {/* Quote details */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Quote details</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span>1 USDC = $1.00 {currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">XRamp fee (1%)</span>
              <span>${(parseFloat(sellAmount) * 0.01).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-medium">
              <span>You receive</span>
              <span>${receiveAmount}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Settlement: Avalanche Fuji · USDC</span>
            </div>
          </div>
        </div>

        {/* Payout method */}
        <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
          {payoutMethod && <RailIcon rail={payoutMethod.id} size={36} />}
          <div className="flex-1">
            <p className="font-medium text-sm">{payoutMethod?.name}</p>
            {payoutHandle && (
              <p className="text-xs text-primary font-mono mt-0.5">{payoutHandle}</p>
            )}
            <p className="text-xs text-muted-foreground">Payout method</p>
          </div>
        </div>

        {/* Wallet signing notice */}
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <Wallet className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Your wallet will show 4 popups</span> — mint USDC, create escrow, approve spend, deposit. All required to lock {sellAmount} USDC on Fuji testnet. Approve each in order.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:relative md:p-0 md:mt-6">
        <div className="max-w-md mx-auto space-y-2">
          {confirmError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{confirmError}</span>
            </div>
          )}
          {confirming && (
            <div className="flex items-center gap-2">
              <KineticDotsLoader dots={3} className="py-0" />
              <span className="text-xs text-muted-foreground">
                {confirmStep === 'transitioning' && 'Confirming intent…'}
                {confirmStep === 'minting' && 'Wallet popup 1/4 — Minting test USDC…'}
                {confirmStep === 'creating_escrow' && 'Wallet popup 2/4 — Creating escrow…'}
                {confirmStep === 'approving' && 'Wallet popup 3/4 — Approving USDC spend…'}
                {confirmStep === 'depositing' && 'Wallet popup 4/4 — Depositing into escrow…'}
                {confirmStep === 'reporting' && 'Recording on-chain…'}
              </span>
            </div>
          )}
          <InteractiveHoverButton
            text={confirming ? ' ' : 'Confirm sell'}
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full h-12 text-base rounded-xl border-primary/40 text-foreground"
          />
          <Button
            variant="ghost"
            className="w-full text-sm"
            size="sm"
            onClick={() => navigate('/sell')}
          >
            Change method
          </Button>
        </div>
      </div>
    </div>
  );
}
