import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink, Copy, Check, HelpCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityItem {
  id: string;
  type: 'buy' | 'sell';
  cryptoAmount: string;
  crypto: string;
  fiatAmount: string;
  fiat: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'action_needed';
  timestamp: string;
  createdAt: string;
  txHash?: string;
  rate: string;
  fee: string;
  referenceCode?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'buy',
    cryptoAmount: '500',
    crypto: 'USDC',
    fiatAmount: '502.50',
    fiat: 'USD',
    method: 'Venmo',
    status: 'completed',
    timestamp: '2h ago',
    createdAt: '2024-01-15 14:30',
    txHash: '0xabc...def',
    rate: '1.00',
    fee: '2.50',
    referenceCode: 'XR-8A7F3B',
  },
  {
    id: '2',
    type: 'sell',
    cryptoAmount: '0.15',
    crypto: 'ETH',
    fiatAmount: '450.00',
    fiat: 'USD',
    method: 'Cash App',
    status: 'pending',
    timestamp: '5h ago',
    createdAt: '2024-01-15 11:00',
    rate: '3000.00',
    fee: '4.50',
    referenceCode: 'XR-C2D4E6',
  },
  {
    id: '3',
    type: 'buy',
    cryptoAmount: '1,200',
    crypto: 'USDC',
    fiatAmount: '1,206.00',
    fiat: 'USD',
    method: 'Zelle',
    status: 'completed',
    timestamp: 'Yesterday',
    createdAt: '2024-01-14 09:15',
    txHash: '0x123...789',
    rate: '1.00',
    fee: '6.00',
    referenceCode: 'XR-9B8C7D',
  },
];

type FilterType = 'all' | 'pending' | 'completed';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  action_needed: 'Action needed',
};

const timelineSteps = [
  { key: 'created', label: 'Created' },
  { key: 'waiting', label: 'Waiting for transfer' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
];

export default function Activity() {
  const { isAuthenticated, login } = useAuth();
  const { privacyMode } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const filteredActivities = mockActivities.filter((activity) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return activity.status === 'pending' || activity.status === 'processing';
    if (filter === 'completed') return activity.status === 'completed';
    return true;
  });

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ];

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getTimelineStatus = (activity: ActivityItem) => {
    switch (activity.status) {
      case 'completed':
        return 4;
      case 'processing':
        return 3;
      case 'pending':
        return 2;
      default:
        return 1;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <h1 className="text-2xl font-semibold mb-6">Activity</h1>
        <div className="bg-card border border-border rounded-2xl text-center py-16">
          <p className="text-muted-foreground mb-4">Log in to see your activity</p>
          <Button onClick={login}>Log in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="text-2xl font-semibold mb-6">Activity</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filter === f.value
                ? 'bg-card text-foreground border border-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      {filteredActivities.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl text-center py-16">
          <p className="text-muted-foreground font-medium mb-1">No activity yet</p>
          <p className="text-muted-foreground text-sm">Your buys and sells will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
              className="bg-card border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    activity.type === 'buy' ? 'bg-success/10' : 'bg-primary/10'
                  )}
                >
                  {activity.type === 'buy' ? (
                    <ArrowDownToLine className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowUpFromLine className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  {(activity.status === 'pending' || activity.status === 'processing') ? (
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-sm">
                        {activity.type === 'buy' ? 'Buy' : 'Sell'} • {activity.type === 'buy' ? '+' : '-'}
                        {activity.cryptoAmount} {activity.crypto}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.method} • {activity.timestamp}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    activity.status === 'completed' && 'status-completed',
                    activity.status === 'pending' && 'status-pending',
                    activity.status === 'processing' && 'status-pending',
                    activity.status === 'action_needed' && 'bg-primary/10 text-primary border border-primary/20'
                  )}
                >
                  {statusLabels[activity.status]}
                </span>
                <button className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Details Sheet */}
      <Sheet open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <SheetContent className="bg-background border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order details</SheetTitle>
          </SheetHeader>
          {selectedActivity && (
            <div className="mt-6 space-y-6">
              {/* Summary */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    selectedActivity.type === 'buy' ? 'bg-success/10' : 'bg-primary/10'
                  )}
                >
                  {selectedActivity.type === 'buy' ? (
                    <ArrowDownToLine className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowUpFromLine className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold capitalize">{selectedActivity.type}</p>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      selectedActivity.status === 'completed' && 'status-completed',
                      selectedActivity.status === 'pending' && 'status-pending'
                    )}
                  >
                    {statusLabels[selectedActivity.status]}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-0">
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground text-sm">Amount</span>
                  <span className={cn('font-medium numeral-display', privacyMode && 'privacy-blur')}>
                    {selectedActivity.cryptoAmount} {selectedActivity.crypto}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground text-sm">
                    {selectedActivity.type === 'buy' ? 'Paid' : 'Received'}
                  </span>
                  <span className={cn('font-medium numeral-display', privacyMode && 'privacy-blur')}>
                    ${selectedActivity.fiatAmount}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground text-sm">Rate</span>
                  <span className="font-medium">1 {selectedActivity.crypto} = ${selectedActivity.rate}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground text-sm">Fee</span>
                  <span className="font-medium">${selectedActivity.fee}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground text-sm">Method</span>
                  <span className="font-medium">{selectedActivity.method}</span>
                </div>
                {selectedActivity.referenceCode && (
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground text-sm">Reference</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{selectedActivity.referenceCode}</span>
                      <button 
                        onClick={() => handleCopy('ref', selectedActivity.referenceCode!)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {copiedField === 'ref' ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {selectedActivity.txHash && (
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground text-sm">Transaction</span>
                    <a
                      href="#"
                      className="font-medium font-mono text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      {selectedActivity.txHash}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                <div className="space-y-2">
                  {timelineSteps.map((step, index) => {
                    const currentStep = getTimelineStatus(selectedActivity);
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep - 1;
                    
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div className={cn(
                          'h-6 w-6 rounded-full flex items-center justify-center',
                          isCompleted ? 'bg-success/10' : 'bg-muted'
                        )}>
                          {isCompleted ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <div className={cn(
                              'h-2 w-2 rounded-full',
                              isCurrent ? 'bg-primary' : 'bg-muted-foreground'
                            )} />
                          )}
                        </div>
                        <span className={cn(
                          'text-sm',
                          isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2">
                <HelpCircle className="h-4 w-4" />
                Need help?
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
