import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ArrowRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'buy' | 'sell';
  amount: string;
  crypto: string;
  method: string;
  status: 'pending' | 'completed';
  timestamp: string;
}

const recentItems: ActivityItem[] = [
  {
    id: '1',
    type: 'buy',
    amount: '500',
    crypto: 'USDC',
    method: 'Venmo',
    status: 'completed',
    timestamp: '2h ago',
  },
  {
    id: '2',
    type: 'sell',
    amount: '0.15',
    crypto: 'ETH',
    method: 'Cash App',
    status: 'pending',
    timestamp: '5h ago',
  },
  {
    id: '3',
    type: 'buy',
    amount: '1,200',
    crypto: 'USDC',
    method: 'Zelle',
    status: 'completed',
    timestamp: '1d ago',
  },
];

export function RecentActivity() {
  const navigate = useNavigate();
  const { privacyMode } = useApp();

  return (
    <div className="w-full max-w-md mx-auto mt-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Recent activity</h3>
        <button 
          onClick={() => navigate('/activity')}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {recentItems.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate('/activity')}
            className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  item.type === 'buy' ? 'bg-success/10' : 'bg-primary/10'
                )}
              >
                {item.type === 'buy' ? (
                  <ArrowDownToLine className="h-4 w-4 text-success" />
                ) : (
                  <ArrowUpFromLine className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm capitalize">{item.type}</p>
                <p className="text-xs text-muted-foreground">
                  {item.method} • {item.timestamp}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                'font-medium text-sm numeral-display',
                privacyMode && 'privacy-blur'
              )}>
                {item.type === 'buy' ? '+' : '-'}{item.amount} {item.crypto}
              </p>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  item.status === 'completed' && 'status-completed',
                  item.status === 'pending' && 'status-pending'
                )}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
