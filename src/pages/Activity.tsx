import { useEffect, useMemo, useState, useCallback } from 'react';
import KineticDotsLoader from '@/components/ui/kinetic-dots-loader';
import { ArrowDownToLine, ArrowUpFromLine, Eye, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { RailIcon } from '@/components/shared/RailIcon';
import { orchestratorApi, type OrchestratorIntent } from '@/lib/orchestratorApi';

type FilterType = 'all' | 'active' | 'completed';

const ACTIVE_STATES = new Set(['CREATED', 'FUNDING', 'FUNDED', 'SWAPPING', 'READY_TO_WITHDRAW', 'WITHDRAWING']);

function formatType(type: OrchestratorIntent['type']) {
  return type === 'OFFRAMP' ? 'Sell' : type === 'ONRAMP' ? 'Buy' : type;
}

function stateLabel(state: string) {
  return state.replace(/_/g, ' ');
}

function stateBadgeClass(state: string) {
  if (state === 'COMPLETE') return 'bg-success/15 text-success border border-success/30';
  if (state === 'FAILED' || state === 'CANCELED' || state === 'EXPIRED') return 'bg-destructive/15 text-destructive border border-destructive/30';
  return 'bg-primary/10 text-primary border border-primary/20 animate-pulse';
}

export default function Activity() {
  const { isAuthenticated, login, user } = useAuth();
  const { privacyMode } = useApp();

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedActivity, setSelectedActivity] = useState<OrchestratorIntent | null>(null);
  const [activities, setActivities] = useState<OrchestratorIntent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.email || user?.walletAddress || user?.embeddedWalletAddress || 'guest';

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const { intents } = await orchestratorApi.listIntents(userId);
      setActivities(intents);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    // Auto-poll every 5s to reflect state progressions in demo mode
    const interval = setInterval(() => load(true), 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, load]);

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    if (filter === 'completed') return activities.filter((a) => a.state === 'COMPLETE');
    return activities.filter((a) => ACTIVE_STATES.has(a.state));
  }, [activities, filter]);

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <h1 className="text-2xl font-semibold mb-6">Activity</h1>
        <div className="bg-card border border-border rounded-2xl text-center py-16">
          <p className="text-muted-foreground mb-4">Log in to see your activity</p>
          <InteractiveHoverButton
            text="Log in"
            onClick={login}
            className="mx-auto h-10 w-32 border-primary/40 text-foreground"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Activity</h1>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium uppercase tracking-widest">Demo</span>
          <button onClick={() => load()} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Refresh">
            <RefreshCw className={cn('h-4 w-4 text-muted-foreground', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filter === f.value ? 'bg-card text-foreground border border-border' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && activities.length === 0 && (
        <div className="flex justify-center py-8">
          <KineticDotsLoader dots={3} className="py-2" />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && filteredActivities.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl text-center py-16">
          <p className="text-muted-foreground font-medium mb-1">No activity yet</p>
          <p className="text-muted-foreground text-sm">Your intents will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity, index) => {
            const isBuy = activity.type === 'ONRAMP';
            return (
              <div
                key={activity.id}
                onClick={() => setSelectedActivity(activity)}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  {activity.rail
                    ? <RailIcon rail={activity.rail} size={40} />
                    : <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0', isBuy ? 'bg-success/10' : 'bg-primary/10')}>
                        {isBuy ? <ArrowDownToLine className="h-4 w-4 text-success" /> : <ArrowUpFromLine className="h-4 w-4 text-primary" />}
                      </div>
                  }
                  <div>
                    <p className="font-medium text-sm">
                      {formatType(activity.type)} · {activity.amount} {activity.sourceAsset} → {activity.targetAsset}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide', stateBadgeClass(activity.state))}>
                    {stateLabel(activity.state)}
                  </span>
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <SheetContent className="bg-background border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Intent details</SheetTitle>
          </SheetHeader>
          {selectedActivity && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Intent ID</span>
                <span className="font-mono text-xs">{selectedActivity.id}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Type</span>
                <span>{formatType(selectedActivity.type)}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">State</span>
                <span>{stateLabel(selectedActivity.state)}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Amount</span>
                <span className={cn(privacyMode && 'privacy-blur')}>{selectedActivity.amount} {selectedActivity.sourceAsset}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Target asset</span>
                <span>{selectedActivity.targetAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(selectedActivity.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
