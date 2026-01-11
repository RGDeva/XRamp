import { CurrencySelect } from './CurrencySelect';
import { cn } from '@/lib/utils';

interface AmountInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  currencyType: 'fiat' | 'crypto';
  readOnly?: boolean;
  estimated?: boolean;
}

export function AmountInput({
  label,
  value,
  onChange,
  currency,
  onCurrencyChange,
  currencyType,
  readOnly = false,
  estimated = false,
}: AmountInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        {label}
        {estimated && (
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">estimated</span>
        )}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className={cn(
            'xramp-input-large flex-1',
            readOnly && 'bg-muted cursor-default'
          )}
          placeholder="0.00"
        />
        <CurrencySelect
          type={currencyType}
          value={currency}
          onValueChange={onCurrencyChange}
        />
      </div>
    </div>
  );
}
