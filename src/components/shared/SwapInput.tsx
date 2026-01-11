import { CurrencySelect } from './CurrencySelect';
import { cn } from '@/lib/utils';

interface SwapInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  currencyType: 'fiat' | 'crypto';
  readOnly?: boolean;
  showEstimate?: boolean;
}

export function SwapInput({
  label,
  value,
  onChange,
  currency,
  onCurrencyChange,
  currencyType,
  readOnly = false,
  showEstimate = false,
}: SwapInputProps) {
  return (
    <div className={cn(
      "rounded-xl p-4 transition-all duration-200",
      readOnly ? "bg-muted/30" : "bg-secondary/50 focus-within:bg-secondary/70 focus-within:ring-1 focus-within:ring-primary/30"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {showEstimate && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            estimated
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder="0.00"
          className={cn(
            "flex-1 bg-transparent text-3xl font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none numeral-display",
            readOnly && "cursor-default text-foreground/80"
          )}
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
