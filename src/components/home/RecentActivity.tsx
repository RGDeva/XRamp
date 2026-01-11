import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface ActivityItem {
  id: string;
  type: 'buy' | 'sell';
  amount: string;
  crypto: string;
  fiat: string;
  status: 'pending' | 'completed';
  timestamp: string;
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'buy',
    amount: '500',
    crypto: 'USDC',
    fiat: 'USD',
    status: 'completed',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    type: 'sell',
    amount: '0.15',
    crypto: 'ETH',
    fiat: 'USD',
    status: 'pending',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    type: 'buy',
    amount: '1,200',
    crypto: 'USDC',
    fiat: 'USD',
    status: 'completed',
    timestamp: 'Yesterday',
  },
];

export function RecentActivity() {
  const { wallet, privacyMode } = useApp();
  const navigate = useNavigate();

  if (!wallet.isConnected) {
    return null;
  }

  return (
    <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        <button
          onClick={() => navigate('/activity')}
          className="text-sm text-primary hover:underline"
        >
          View all
        </button>
      </div>
      <div className="space-y-3">
        {mockActivity.map((item) => (
          <div
            key={item.id}
            className="xramp-card p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/activity')}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  item.type === 'buy' ? 'bg-success/10' : 'bg-primary/10'
                )}
              >
                {item.type === 'buy' ? (
                  <ArrowDownToLine
                    className={cn('h-5 w-5', item.type === 'buy' ? 'text-success' : 'text-primary')}
                  />
                ) : (
                  <ArrowUpFromLine className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground capitalize">{item.type}</p>
                <p className="text-sm text-muted-foreground">{item.timestamp}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn('font-medium numeral-display', privacyMode && 'privacy-blur')}>
                {item.type === 'buy' ? '+' : '-'}
                {item.amount} {item.crypto}
              </p>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  item.status === 'completed' ? 'status-completed' : 'status-pending'
                )}
              >
                {item.status === 'completed' ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
