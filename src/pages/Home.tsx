import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ArrowRight, Eye, EyeOff, Zap, DollarSign, Shield, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { WordRotate } from '@/components/ui/word-rotate';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { useAuth, truncateAddress, getDeliveryAddress } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DepositWidget } from '@/components/deposit';
import xrampLogo from '@/assets/xramp-logo-full.png';
import KineticDotsLoader from '@/components/ui/kinetic-dots-loader';
const recentItems = [
  {
    id: '1',
    type: 'buy' as const,
    amount: '500',
    crypto: 'USDC',
    method: 'Venmo',
    status: 'completed' as const,
    timestamp: '2h ago',
  },
  {
    id: '2',
    type: 'sell' as const,
    amount: '0.15',
    crypto: 'ETH',
    method: 'Cash App',
    status: 'pending' as const,
    timestamp: '5h ago',
  },
  {
    id: '3',
    type: 'buy' as const,
    amount: '1,200',
    crypto: 'USDC',
    method: 'Zelle',
    status: 'completed' as const,
    timestamp: '1d ago',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, login } = useAuth();
  const { privacyMode, togglePrivacyMode } = useApp();

  const deliveryAddress = getDeliveryAddress(user);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <KineticDotsLoader dots={4} />
        <p className="text-sm text-muted-foreground mt-2">Loading XRamp…</p>
      </div>
    );
  }

  // Not logged in state - ZKP2P style landing
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center relative">
          {/* Background subtle grid */}
          <div className="absolute inset-0 proof-grid" />
          
          <div className="relative z-10 w-full max-w-4xl mx-auto">
            {/* Main Headline */}
            <div className="mb-6 animate-fade-in">
              <WordRotate
                words={['Buy crypto', 'Sell crypto']}
                duration={2500}
                className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight"
              />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                <AnimatedGradientText>in 60 seconds</AnimatedGradientText>
              </h1>
            </div>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '50ms' }}>
              Deposit from any chain using any token
            </p>

            {/* Deposit Widget — Get Started triggers Privy login */}
            <div className="mb-8 flex justify-center animate-fade-in" style={{ animationDelay: '100ms' }}>
              <DepositWidget onGetStarted={login} />
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
              <button 
                onClick={() => document.getElementById('learn-more')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
              >
                Learn more
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* What is XRamp Section */}
        <div id="learn-more" className="px-4 py-16 bg-card/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Left - Text */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">What is XRamp?</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    XRamp lets you buy or cash out crypto using everyday payment rails like Venmo, Cash App, Zelle, Revolut, or a bank transfer—without relying on a traditional exchange to hold your funds.
                  </p>
                  <p>
                    Most places make you go through a centralized platform that adds friction, higher fees, and often asks for a lot of personal info. XRamp is built to keep the flow simple and collect as little data as possible.
                  </p>
                  <p>
                    Behind the scenes, XRamp verifies that the payment was actually sent using "proof-based" checks, then completes the crypto transfer through smart contracts. So the trade can finish safely without XRamp needing to custody your money.
                  </p>
                </div>
              </div>

              {/* Right - Feature Cards */}
              <div className="space-y-4">
                <div className="relative bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                  <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Fast</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate a proof in seconds, no waiting for seller to release funds.
                    </p>
                  </div>
                </div>

                <div className="relative bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                  <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Cheap</h3>
                    <p className="text-sm text-muted-foreground">
                      No intermediaries, every transaction is directly with a seller.
                    </p>
                  </div>
                </div>

                <div className="relative bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                  <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Zero fraud</h3>
                    <p className="text-sm text-muted-foreground">
                      Cryptographic proofs ensure all transactions are authentic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-4 py-8 text-center">
          <p className="text-xs text-muted-foreground">
            Minimal data. Proof-based settlement. Verification may be required depending on payment method, region, or limits.
          </p>
        </div>
      </div>
    );
  }

  // Logged in state - Cash App style
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8 pb-24 md:pb-8">
      <div className="w-full max-w-md space-y-6">
        {/* User info card */}
        <div className="relative bg-card border border-border rounded-2xl p-6 shadow-elevated animate-fade-in">
          <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Signed in</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={togglePrivacyMode}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    privacyMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Hides amounts on screen only.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* User identifier */}
          {user?.email && (
            <p className="font-medium text-lg mb-1">{user.email}</p>
          )}
          
          {/* Delivery address */}
          {deliveryAddress && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Delivery address</p>
              <p className={cn(
                'font-mono text-sm',
                privacyMode && 'privacy-blur'
              )}>
                {truncateAddress(deliveryAddress)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Where your crypto is sent.</p>
            </div>
          )}
        </div>

        {/* Action buttons - Cash App style */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <InteractiveHoverButton
            text="Buy"
            onClick={() => navigate('/ramp?tab=Buy')}
            className="w-full h-20 text-lg rounded-2xl border-primary/40 text-foreground"
          />
          <InteractiveHoverButton
            text="Sell"
            onClick={() => navigate('/ramp?tab=Sell')}
            className="w-full h-20 text-lg rounded-2xl border-primary/30 text-primary"
          />
        </div>

        {/* Recent activity */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Recent activity</h3>
            <button 
              onClick={() => navigate('/activity')}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {recentItems.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-sm font-medium mb-1">No activity yet</p>
              <p className="text-muted-foreground text-xs">Your buys and sells will show up here.</p>
            </div>
          ) : (
            <div className="relative bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
              <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
              {recentItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/activity')}
                  className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        item.type === 'buy' ? 'bg-success/10' : 'bg-primary/10'
                      )}
                    >
                      {item.type === 'buy' ? (
                        <ArrowDownToLine className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowUpFromLine className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {item.type} • +{item.amount} {item.crypto}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.method} • {item.timestamp}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      item.status === 'completed' && 'status-completed',
                      item.status === 'pending' && 'status-pending'
                    )}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>
          Minimal data. Proof-based settlement.
        </p>
      </div>
    </div>
  );
}
