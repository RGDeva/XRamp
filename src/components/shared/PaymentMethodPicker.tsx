import { useState } from 'react';
import { Check, Clock, AlertCircle, X } from 'lucide-react';
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

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  maxAmount: number;
  eta: string;
  cooldown?: string;
  available: boolean;
  unavailableReason?: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'venmo', name: 'Venmo', icon: 'V', maxAmount: 2000, eta: '~10 min', available: true },
  { id: 'cashapp', name: 'Cash App', icon: '$', maxAmount: 1500, eta: '~10 min', available: true },
  { id: 'zelle', name: 'Zelle', icon: 'Z', maxAmount: 2500, eta: '~15 min', available: true },
  { id: 'revolut', name: 'Revolut', icon: 'R', maxAmount: 5000, eta: '~20 min', available: true },
  { id: 'wise', name: 'Wise', icon: 'W', maxAmount: 10000, eta: '~1 hour', available: true },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦', maxAmount: 50000, eta: '1-3 days', cooldown: '24h cooldown', available: true },
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
  const getAvailableMethods = () => {
    return paymentMethods.map(method => ({
      ...method,
      available: method.available && (amount <= method.maxAmount || amount === 0),
      unavailableReason: amount > method.maxAmount 
        ? `Max $${method.maxAmount.toLocaleString()} per transaction`
        : method.unavailableReason,
    }));
  };

  const methods = getAvailableMethods();

  const handleSelect = (methodId: string) => {
    const method = methods.find(m => m.id === methodId);
    if (method?.available) {
      onValueChange(methodId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {type === 'payment' ? 'Choose payment method' : 'Choose payout method'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 mt-4">
          {methods.map((method) => (
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
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center text-base font-semibold',
                      method.available ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground'
                    )}>
                      {method.icon}
                    </div>
                    <div className="text-left">
                      <p className={cn('font-medium', !method.available && 'text-muted-foreground')}>
                        {method.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Max ${method.maxAmount.toLocaleString()}</span>
                        {method.cooldown && (
                          <>
                            <span>•</span>
                            <span>{method.cooldown}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{method.eta}</span>
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
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Verification may be required depending on payment method, limits, or region.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function getPaymentMethodById(id: string): PaymentMethod | undefined {
  return paymentMethods.find(m => m.id === id);
}
