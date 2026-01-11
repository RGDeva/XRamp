import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ActionButtons() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
      <Button
        variant="hero"
        className="h-24 flex-col gap-2"
        onClick={() => navigate('/buy')}
      >
        <ArrowDownToLine className="h-6 w-6" />
        <span>Buy</span>
      </Button>
      <Button
        variant="hero-outline"
        className="h-24 flex-col gap-2"
        onClick={() => navigate('/sell')}
      >
        <ArrowUpFromLine className="h-6 w-6" />
        <span>Sell</span>
      </Button>
    </div>
  );
}
