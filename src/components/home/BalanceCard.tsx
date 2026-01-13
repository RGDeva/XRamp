import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function BalanceCard() {
  const navigate = useNavigate();
  const { wallet, privacyMode, togglePrivacyMode } = useApp();

  return (
    <div className="w-full max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Balance display */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Your balance</span>
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
              <p className="text-sm">
                {privacyMode ? 'Privacy mode on – amounts hidden' : 'Hide amounts on screen'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <p className={cn(
          'text-4xl font-bold numeral-display mb-1',
          privacyMode && 'privacy-blur'
        )}>
          ${wallet.balance}
        </p>
        <p className="text-sm text-muted-foreground">
          {privacyMode ? '••••••' : wallet.address}
        </p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="hero"
          size="lg"
          onClick={() => navigate('/buy')}
          className="h-14 text-base"
        >
          <ArrowDownToLine className="h-5 w-5 mr-2" />
          Buy
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/sell')}
          className="h-14 text-base border-primary/30 text-primary hover:bg-primary/10"
        >
          <ArrowUpFromLine className="h-5 w-5 mr-2" />
          Sell
        </Button>
      </div>
    </div>
  );
}
