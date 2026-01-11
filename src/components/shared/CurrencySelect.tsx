import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

const fiatCurrencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

const cryptoCurrencies: Currency[] = [
  { code: 'USDC', name: 'USD Coin', symbol: '' },
  { code: 'ETH', name: 'Ethereum', symbol: '' },
  { code: 'BTC', name: 'Bitcoin', symbol: '' },
];

interface CurrencySelectProps {
  type: 'fiat' | 'crypto';
  value: string;
  onValueChange: (value: string) => void;
}

export function CurrencySelect({ type, value, onValueChange }: CurrencySelectProps) {
  const currencies = type === 'fiat' ? fiatCurrencies : cryptoCurrencies;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-24 bg-secondary border-0 font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
