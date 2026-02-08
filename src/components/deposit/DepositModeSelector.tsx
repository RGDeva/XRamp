import { cn } from '@/lib/utils';
import { DEPOSIT_MODES, DepositMode } from './TrustwareConfig';

interface DepositModeSelectorProps {
  value: DepositMode;
  onChange: (mode: DepositMode) => void;
}

export function DepositModeSelector({ value, onChange }: DepositModeSelectorProps) {
  return (
    <div className="flex rounded-xl bg-secondary/50 p-1 gap-1">
      {DEPOSIT_MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          className={cn(
            'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all',
            value === mode.id
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
