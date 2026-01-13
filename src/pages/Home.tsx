import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ArrowRight, Eye, EyeOff, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, truncateAddress, getDeliveryAddress } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Mock recent activity data
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
  const { isAuthenticated, user, login } = useAuth();
  const { privacyMode, togglePrivacyMode } = useApp();

  const deliveryAddress = getDeliveryAddress(user);

  // Not logged in state
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Hero text */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-3">
              XRamp
            </h1>
            <p className="text-lg text-muted-foreground">
              Buy or sell crypto in a few taps.
            </p>
          </div>

          {/* Login card */}
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-elevated animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Log in to start</h2>
              <p className="text-muted-foreground text-sm">
                Connect once, then use Buy or Sell anytime.
              </p>
            </div>

            <Button 
              variant="hero" 
              size="lg" 
              onClick={login}
              className="w-full"
            >
              Log in
            </Button>

            <p className="text-xs text-muted-foreground">
              We only use what's needed to complete your order.
            </p>
          </div>

          {/* Tagline */}
          <p className="text-center text-sm text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            Private. Fast. Simple.
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
        <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated animate-fade-in">
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
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate('/buy')}
            className="h-20 text-lg flex-col gap-1"
          >
            <ArrowDownToLine className="h-6 w-6" />
            Buy
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/sell')}
            className="h-20 text-lg flex-col gap-1 border-primary/30 text-primary hover:bg-primary/10"
          >
            <ArrowUpFromLine className="h-6 w-6" />
            Sell
          </Button>
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
            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
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
