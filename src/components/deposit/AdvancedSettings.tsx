import { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CHAIN_OPTIONS, TOKEN_OPTIONS } from './TrustwareConfig';

interface AdvancedSettingsProps {
  chain: string;
  token: string;
  slippage: string;
  onChainChange: (chain: string) => void;
  onTokenChange: (token: string) => void;
  onSlippageChange: (slippage: string) => void;
}

export function AdvancedSettings({
  chain,
  token,
  slippage,
  onChainChange,
  onTokenChange,
  onSlippageChange,
}: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const slippageOptions = ['0.5', '1', '2', '3'];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <div className="flex items-center gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          <span>Advanced</span>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pt-2 pb-1">
          {/* Destination Chain */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Destination chain</span>
            <Select value={chain} onValueChange={onChainChange}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHAIN_OPTIONS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-1.5">
                      <span>{c.icon}</span>
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination Token */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Destination token</span>
            <Select value={token} onValueChange={onTokenChange}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_OPTIONS.map((t) => (
                  <SelectItem key={t.address} value={t.address}>
                    {t.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Slippage */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Slippage</span>
            <div className="flex gap-1">
              {slippageOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSlippageChange(s)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs transition-colors',
                    slippage === s
                      ? 'bg-primary/20 text-primary'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
