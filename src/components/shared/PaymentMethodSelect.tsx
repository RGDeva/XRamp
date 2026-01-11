import { CreditCard, Building2, Smartphone } from 'lucide-react';
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
  { id: 'venmo', name: 'Venmo', icon: <span className="text-base">V</span>, available: true },
  { id: 'cashapp', name: 'Cash App', icon: <span className="text-base">$</span>, available: true },
  { id: 'zelle', name: 'Zelle', icon: <span className="text-base">Z</span>, available: true },
  { id: 'revolut', name: 'Revolut', icon: <span className="text-base">R</span>, available: true },
  { id: 'bank', name: 'Bank Transfer', icon: <Building2 className="h-4 w-4" />, available: true },
  { id: 'card', name: 'Card', icon: <CreditCard className="h-4 w-4" />, available: true },
  { id: 'apple-pay', name: 'Apple Pay', icon: <Smartphone className="h-4 w-4" />, available: true },
];

interface PaymentMethodSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  type?: 'payment' | 'payout';
  label?: string;
}

export function PaymentMethodSelect({ value, onValueChange, type = 'payment', label }: PaymentMethodSelectProps) {
  const selected = paymentMethods.find(m => m.id === value);

  return (
    <div className="rounded-xl p-4 bg-secondary/50">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {label || (type === 'payment' ? 'Paying using' : 'Receive via')}
        </span>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-auto min-w-[120px] bg-muted/50 border-0 rounded-lg h-9 gap-2 px-3 hover:bg-muted transition-colors">
            <div className="flex items-center gap-2">
              {selected?.icon}
              <span className="font-medium">{selected?.name}</span>
            </div>
          </SelectTrigger>
          <SelectContent align="end">
            {paymentMethods.map((method) => (
              <SelectItem
                key={method.id}
                value={method.id}
                disabled={!method.available}
                className={cn(!method.available && 'opacity-50')}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 flex justify-center">{method.icon}</span>
                  <span>{method.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
