import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface ActivityItem {
  id: string;
  type: 'buy' | 'sell';
  cryptoAmount: string;
  crypto: string;
  fiatAmount: string;
  fiat: string;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  txHash?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'buy',
    cryptoAmount: '500',
    crypto: 'USDC',
    fiatAmount: '502.50',
    fiat: 'USD',
    method: 'Apple Pay',
    status: 'completed',
    timestamp: '2 hours ago',
    txHash: '0xabc...def',
  },
  {
    id: '2',
    type: 'sell',
    cryptoAmount: '0.15',
    crypto: 'ETH',
    fiatAmount: '450.00',
    fiat: 'USD',
    method: 'Bank Transfer',
    status: 'pending',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    type: 'buy',
    cryptoAmount: '1,200',
    crypto: 'USDC',
    fiatAmount: '1,206.00',
    fiat: 'USD',
    method: 'Venmo',
    status: 'completed',
    timestamp: 'Yesterday',
    txHash: '0x123...789',
  },
  {
    id: '4',
    type: 'sell',
    cryptoAmount: '0.5',
    crypto: 'BTC',
    fiatAmount: '21,500.00',
    fiat: 'USD',
    method: 'Wise',
    status: 'completed',
    timestamp: '3 days ago',
    txHash: '0xdef...abc',
  },
  {
    id: '5',
    type: 'buy',
    cryptoAmount: '250',
    crypto: 'USDC',
    fiatAmount: '251.25',
    fiat: 'USD',
    method: 'Card',
    status: 'failed',
    timestamp: '1 week ago',
  },
];

type FilterType = 'all' | 'pending' | 'completed';

export default function Activity() {
  const { privacyMode, wallet } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  const filteredActivities = mockActivities.filter((activity) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return activity.status === 'pending';
    if (filter === 'completed') return activity.status === 'completed';
    return true;
  });

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Activity</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      {!wallet.isConnected ? (
        <div className="xramp-card text-center py-12">
          <p className="text-muted-foreground">Connect your wallet to see activity</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="xramp-card text-center py-12">
          <p className="text-muted-foreground">No activity found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
              className="xramp-card p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    activity.type === 'buy' ? 'bg-success/10' : 'bg-primary/10'
                  )}
                >
                  {activity.type === 'buy' ? (
                    <ArrowDownToLine className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowUpFromLine className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium capitalize">{activity.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.method} • {activity.timestamp}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn('font-medium numeral-display', privacyMode && 'privacy-blur')}>
                  {activity.type === 'buy' ? '+' : '-'}
                  {activity.cryptoAmount} {activity.crypto}
                </p>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    activity.status === 'completed' && 'status-completed',
                    activity.status === 'pending' && 'status-pending',
                    activity.status === 'failed' && 'status-failed'
                  )}
                >
                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Details Sheet */}
      <Sheet open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <SheetContent className="bg-card border-border">
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
          </SheetHeader>
          {selectedActivity && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-xl',
                    selectedActivity.type === 'buy' ? 'bg-success/10' : 'bg-primary/10'
                  )}
                >
                  {selectedActivity.type === 'buy' ? (
                    <ArrowDownToLine className="h-6 w-6 text-success" />
                  ) : (
                    <ArrowUpFromLine className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-xl font-semibold capitalize">{selectedActivity.type}</p>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      selectedActivity.status === 'completed' && 'status-completed',
                      selectedActivity.status === 'pending' && 'status-pending',
                      selectedActivity.status === 'failed' && 'status-failed'
                    )}
                  >
                    {selectedActivity.status.charAt(0).toUpperCase() + selectedActivity.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Amount</span>
                  <span className={cn('font-medium numeral-display', privacyMode && 'privacy-blur')}>
                    {selectedActivity.cryptoAmount} {selectedActivity.crypto}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">
                    {selectedActivity.type === 'buy' ? 'Paid' : 'Received'}
                  </span>
                  <span className={cn('font-medium numeral-display', privacyMode && 'privacy-blur')}>
                    ${selectedActivity.fiatAmount} {selectedActivity.fiat}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">{selectedActivity.method}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedActivity.timestamp}</span>
                </div>
                {selectedActivity.txHash && (
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Transaction</span>
                    <a
                      href="#"
                      className="font-medium font-mono text-primary flex items-center gap-1 hover:underline"
                    >
                      {selectedActivity.txHash}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
