import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ShieldCheck, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { RailIcon } from '@/components/shared/RailIcon';
import { txUrl } from '@/lib/fuji';
import { cn } from '@/lib/utils';
import { getProvider } from '@/lib/providers';


function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
        copied
          ? 'bg-success/15 text-success border border-success/30'
          : 'bg-secondary/80 text-muted-foreground hover:text-foreground border border-border hover:border-primary/30',
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function BuyComplete() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state || {};
  const payAmount: string = state.payAmount || '1.00';
  const currency: string = state.currency || 'USD';
  const paymentMethodId: string = state.paymentMethod || 'venmo';
  const intentId: string | undefined = state.intentId;
  const depositTxHash: string | undefined = state.depositTxHash;

  const provider = getProvider(paymentMethodId);
  const lpHandle = provider.lpHandle;

  // Memo the user must include in payment so proof can be verified
  const memo = intentId ? `XRAMP-${intentId.slice(0, 8)}` : 'XRAMP-payment';

  // Venmo-specific deep link (only used when rail === 'venmo')
  const venmoHandle = lpHandle.replace('@', '');
  const venmoProfileUrl = `https://venmo.com/${venmoHandle}`;
  const venmoDeepLink = `venmo://paycharge?txn=pay&recipients=${venmoHandle}&amount=${payAmount}&note=${encodeURIComponent(memo)}`;
  const qrPayload = venmoDeepLink;

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32 md:pb-8 space-y-4">

      {/* Escrow confirmed badge */}
      <div className="relative bg-card border border-border rounded-2xl p-5 animate-fade-in overflow-hidden">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Escrow locked on Avalanche Fuji</p>
            <p className="text-xs text-muted-foreground mt-0.5">USDC is held in escrow — released when payment is verified.</p>
          </div>
        </div>
        {depositTxHash && (
          <a
            href={txUrl(depositTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline font-mono"
          >
            Escrow deposit: {depositTxHash.slice(0, 10)}…{depositTxHash.slice(-6)}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Payment instructions */}
      <div className="relative bg-card border border-border rounded-2xl p-5 space-y-5 animate-fade-in">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />

        {/* Step header */}
        <div className="flex items-center gap-2">
          <RailIcon rail={paymentMethodId} size={28} />
          <div>
            <p className="font-semibold text-sm">Complete your {provider.label} payment</p>
            <p className="text-xs text-muted-foreground">Copy the details below and send payment via {provider.label}</p>
          </div>
        </div>

        {/* Fallback notice */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-500/90">
            Copy the amount, handle, and memo below and complete the payment manually in {provider.label}.
          </p>
        </div>

        {/* Steps */}
        <ol className="space-y-4">
          {/* Step 1: Amount */}
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">1</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Send exactly this amount</p>
              <div className="flex items-center justify-between bg-secondary/60 rounded-xl px-4 py-3">
                <span className="text-2xl font-bold text-foreground">${payAmount}</span>
                <CopyButton value={payAmount} />
              </div>
            </div>
          </li>

          {/* Step 2: Recipient */}
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">2</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Send to this {provider.label} handle</p>
              <div className="flex items-center justify-between bg-secondary/60 rounded-xl px-4 py-3">
                <span className="font-mono font-semibold text-foreground">{lpHandle}</span>
                <CopyButton value={lpHandle} />
              </div>
            </div>
          </li>

          {/* Step 3: Memo */}
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-destructive/15 text-destructive text-[11px] font-bold flex items-center justify-center">3</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">
                Include this exact memo <span className="text-destructive font-medium">(required for verification)</span>
              </p>
              <div className="flex items-center justify-between bg-secondary/60 rounded-xl px-4 py-3 border border-destructive/20">
                <span className="font-mono text-sm font-semibold text-foreground">{memo}</span>
                <CopyButton value={memo} />
              </div>
            </div>
          </li>
        </ol>

        {/* QR + deep-link — Venmo only */}
        {paymentMethodId === 'venmo' && (
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-xs text-muted-foreground text-center">Or try to open Venmo with payment prefilled</p>

            <a
              href={venmoDeepLink}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = venmoDeepLink;
                setTimeout(() => { window.open(venmoProfileUrl, '_blank'); }, 1500);
              }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#3D95CE]/10 border border-[#3D95CE]/30 text-[#3D95CE] font-semibold text-sm hover:bg-[#3D95CE]/20 transition-colors"
            >
              <RailIcon rail="venmo" size={20} />
              Open Venmo app
            </a>

            <div className="flex flex-col items-center gap-2">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <QRCodeSVG
                  value={qrPayload}
                  size={140}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center max-w-[220px]">
                Scan with phone camera — opens Venmo prefilled. If Venmo web errors, use copy buttons above.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step 4: Verify */}
      <div className="relative bg-card border border-border rounded-2xl p-5 animate-fade-in">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
        <div className="flex gap-3">
          <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">4</span>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold">After sending payment</p>
              <p className="text-xs text-muted-foreground mt-0.5">Open the XRamp extension, find this order, and click <strong>Verify Payment</strong> to submit your proof screenshot.</p>
            </div>
            <InteractiveHoverButton
              text="View in Activity"
              onClick={() => navigate('/activity')}
              className="w-full h-11 text-sm rounded-xl border-primary/40 text-foreground"
            />
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        className="w-full text-sm text-muted-foreground"
        size="sm"
        onClick={() => navigate('/')}
      >
        Back to home
      </Button>
    </div>
  );
}
