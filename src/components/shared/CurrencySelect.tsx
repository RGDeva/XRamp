import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';

interface Currency {
  code: string;
  name: string;
  flag?: string;
  icon?: string;
}

const fiatCurrencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
];

const cryptoCurrencies: Currency[] = [
  { code: 'USDC', name: 'USD Coin', icon: '💵' },
  { code: 'ETH', name: 'Ethereum', icon: '⟠' },
  { code: 'BTC', name: 'Bitcoin', icon: '₿' },
];

interface CurrencySelectProps {
  type: 'fiat' | 'crypto';
  value: string;
  onValueChange: (value: string) => void;
}

export function CurrencySelect({ type, value, onValueChange }: CurrencySelectProps) {
  const currencies = type === 'fiat' ? fiatCurrencies : cryptoCurrencies;
  const selected = currencies.find(c => c.code === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-auto min-w-[100px] bg-muted/50 border-0 rounded-lg h-10 gap-2 px-3 hover:bg-muted transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-base">{selected?.flag || selected?.icon}</span>
          <span className="font-medium text-foreground">{value}</span>
        </div>
      </SelectTrigger>
      <SelectContent align="end">
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center gap-2">
              <span>{currency.flag || currency.icon}</span>
              <span className="font-medium">{currency.code}</span>
              <span className="text-muted-foreground text-sm">{currency.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
