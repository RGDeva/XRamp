import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { orchestratorApi, type OrchestratorIntent } from '@/lib/orchestratorApi';

type FilterType = 'all' | 'active' | 'completed';

const ACTIVE_STATES = new Set(['CREATED', 'FUNDING', 'FUNDED', 'SWAPPING', 'READY_TO_WITHDRAW', 'WITHDRAWING']);

function formatType(type: OrchestratorIntent['type']) {
  return type === 'OFFRAMP' ? 'Sell' : type === 'ONRAMP' ? 'Buy' : type;
}

function stateLabel(state: string) {
  return state.replaceAll('_', ' ');
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

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { intents } = await orchestratorApi.listIntents(userId);
        setActivities(intents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, userId]);

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
          <Button onClick={login}>Log in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="text-2xl font-semibold mb-6">Activity</h1>

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

      {loading && <p className="text-sm text-muted-foreground">Loading activity…</p>}
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
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', isBuy ? 'bg-success/10' : 'bg-primary/10')}>
                    {isBuy ? <ArrowDownToLine className="h-4 w-4 text-success" /> : <ArrowUpFromLine className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{formatType(activity.type)} • {activity.amount} {activity.sourceAsset}</p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-foreground">
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
