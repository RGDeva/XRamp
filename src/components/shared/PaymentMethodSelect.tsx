import { CreditCard, Building2, Smartphone, Wallet } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  available: boolean;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'apple-pay', name: 'Apple Pay', icon: <Smartphone className="h-4 w-4" />, available: true },
  { id: 'card', name: 'Card', icon: <CreditCard className="h-4 w-4" />, available: true },
  { id: 'bank', name: 'Bank Transfer', icon: <Building2 className="h-4 w-4" />, available: true },
  { id: 'venmo', name: 'Venmo', icon: <Wallet className="h-4 w-4" />, available: true },
  { id: 'cashapp', name: 'Cash App', icon: <Wallet className="h-4 w-4" />, available: true },
  { id: 'zelle', name: 'Zelle', icon: <Wallet className="h-4 w-4" />, available: false },
  { id: 'revolut', name: 'Revolut', icon: <Wallet className="h-4 w-4" />, available: true },
  { id: 'wise', name: 'Wise', icon: <Wallet className="h-4 w-4" />, available: true },
];

interface PaymentMethodSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  type?: 'payment' | 'payout';
}

export function PaymentMethodSelect({ value, onValueChange, type = 'payment' }: PaymentMethodSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full bg-input border-border h-12">
        <SelectValue placeholder={`Select ${type} method`} />
      </SelectTrigger>
      <SelectContent>
        {paymentMethods.map((method) => (
          <SelectItem
            key={method.id}
            value={method.id}
            disabled={!method.available}
            className={cn(!method.available && 'opacity-50')}
          >
            <div className="flex items-center gap-3">
              {method.icon}
              <span>{method.name}</span>
              {!method.available && (
                <span className="text-xs text-muted-foreground ml-2">
                  Not available in your region
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
