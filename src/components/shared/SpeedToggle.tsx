import { cn } from '@/lib/utils';

interface SpeedToggleProps {
  value: 'standard' | 'instant';
  onChange: (value: 'standard' | 'instant') => void;
}

export function SpeedToggle({ value, onChange }: SpeedToggleProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Speed</label>
      <div className="flex bg-muted rounded-xl p-1">
        <button
          type="button"
          onClick={() => onChange('standard')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200',
            value === 'standard'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span>Standard</span>
            <span className="text-xs text-muted-foreground">~10 min</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange('instant')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200',
            value === 'instant'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span>Instant</span>
            <span className="text-xs text-muted-foreground">~30 sec</span>
          </div>
        </button>
      </div>
    </div>
  );
}
