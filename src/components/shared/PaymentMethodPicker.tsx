import { useState } from 'react';
import { Check, Clock, AlertCircle, Search } from 'lucide-react';
import { RailIcon } from '@/components/shared/RailIcon';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  maxAmount: number;
  eta: string;
  cooldown?: string;
  available: boolean;
  unavailableReason?: string;
  category: 'popular' | 'apps' | 'bank';
}

const paymentMethods: PaymentMethod[] = [
  { id: 'venmo',   name: 'Venmo',    icon: 'venmo',   maxAmount: 2000,  eta: '~10 min',  available: true, category: 'popular' },
  { id: 'cashapp', name: 'Cash App', icon: 'cashapp', maxAmount: 1500,  eta: '~10 min',  available: true, category: 'popular' },
  { id: 'chime',   name: 'Chime',    icon: 'chime',   maxAmount: 2000,  eta: '~10 min',  available: true, category: 'popular' },
  { id: 'zelle',   name: 'Zelle',    icon: 'zelle',   maxAmount: 2500,  eta: '~15 min',  available: true, category: 'popular' },
  { id: 'revolut', name: 'Revolut',  icon: 'revolut', maxAmount: 5000,  eta: '~20 min',  available: true, category: 'apps' },
  { id: 'wise',    name: 'Wise',     icon: 'wise',    maxAmount: 10000, eta: '~1 hour',  available: true, category: 'apps' },
  { id: 'paypal',  name: 'PayPal',   icon: 'paypal',  maxAmount: 5000,  eta: '~15 min',  available: true, category: 'apps' },
  { id: 'bank',    name: 'Bank transfer', icon: '🏦', maxAmount: 50000, eta: '1-3 days', cooldown: '24h', available: true, category: 'bank' },
];

interface PaymentMethodPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  type: 'payment' | 'payout';
  amount?: number;
  currency?: string;
}

export function PaymentMethodPicker({
  open,
  onOpenChange,
  value,
  onValueChange,
  type,
  amount = 0,
  currency = 'USD',
}: PaymentMethodPickerProps) {
  const [search, setSearch] = useState('');

  const getAvailableMethods = () => {
    return paymentMethods.map(method => ({
      ...method,
      available: method.available && (amount <= method.maxAmount || amount === 0),
      unavailableReason: amount > method.maxAmount 
        ? 'Unavailable for your region or current limits.'
        : method.unavailableReason,
    }));
  };

  const methods = getAvailableMethods();
  const filteredMethods = methods.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const popularMethods = filteredMethods.filter(m => m.category === 'popular');
  const appMethods = filteredMethods.filter(m => m.category === 'apps');
  const bankMethods = filteredMethods.filter(m => m.category === 'bank');

  const handleSelect = (methodId: string) => {
    const method = methods.find(m => m.id === methodId);
    if (method?.available) {
      onValueChange(methodId);
      onOpenChange(false);
    }
  };

  const renderMethod = (method: PaymentMethod) => (
    <Tooltip key={method.id}>
      <TooltipTrigger asChild>
        <button
          onClick={() => handleSelect(method.id)}
          disabled={!method.available}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-xl transition-all',
            method.available 
              ? 'bg-secondary/50 hover:bg-secondary cursor-pointer' 
              : 'bg-muted/30 opacity-50 cursor-not-allowed',
            value === method.id && method.available && 'ring-2 ring-primary bg-primary/10'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center">
              {method.icon.length <= 2
                ? <span className={cn('h-10 w-10 rounded-lg flex items-center justify-center text-base font-semibold', method.available ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground')}>{method.icon}</span>
                : <RailIcon rail={method.icon} size={40} className={cn(!method.available && 'opacity-50')} />
              }
            </div>
            <div className="text-left">
              <p className={cn('font-medium', !method.available && 'text-muted-foreground')}>
                {method.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Limit: ${method.maxAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-right">
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>ETA: {method.eta}</span>
              </div>
              {method.cooldown && (
                <div>Cooldown: {method.cooldown}</div>
              )}
            </div>
            {value === method.id && method.available && (
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            {!method.available && (
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </TooltipTrigger>
      {!method.available && method.unavailableReason && (
        <TooltipContent side="top">
          <p className="text-sm">{method.unavailableReason}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {type === 'payment' ? 'Choose a payment method' : 'Choose a payout method'}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search methods"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="space-y-4 mt-4">
          {/* Popular */}
          {popularMethods.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Popular</p>
              <div className="space-y-2">
                {popularMethods.map(renderMethod)}
              </div>
            </div>
          )}

          {/* Apps */}
          {appMethods.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Apps</p>
              <div className="space-y-2">
                {appMethods.map(renderMethod)}
              </div>
            </div>
          )}

          {/* Bank */}
          {bankMethods.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Bank</p>
              <div className="space-y-2">
                {bankMethods.map(renderMethod)}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Verification may be required depending on method or limits.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function getPaymentMethodById(id: string): PaymentMethod | undefined {
  return paymentMethods.find(m => m.id === id);
}
