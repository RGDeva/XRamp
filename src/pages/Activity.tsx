import { useEffect, useMemo, useState, useCallback } from 'react';
import KineticDotsLoader from '@/components/ui/kinetic-dots-loader';
import { ArrowDownToLine, ArrowUpFromLine, Eye, RefreshCw, ExternalLink, ShieldCheck, AlertCircle, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { RailIcon } from '@/components/shared/RailIcon';
import { orchestratorApi, type OrchestratorIntent } from '@/lib/orchestratorApi';
import { txUrl } from '@/lib/fuji';

const ADMIN_EMAILS = ['rishig@umich.edu'];

type FilterType = 'all' | 'active' | 'completed';

const ACTIVE_STATES = new Set(['CREATED', 'FUNDING', 'FUNDED', 'PROOF_SUBMITTED', 'VERIFIED', 'SWAPPING', 'READY_TO_WITHDRAW', 'WITHDRAWING']);

function formatType(type: OrchestratorIntent['type']) {
  return type === 'OFFRAMP' ? 'Sell' : type === 'ONRAMP' ? 'Buy' : type;
}

function stateLabel(state: string) {
  return state.replace(/_/g, ' ');
}

function stateBadgeClass(state: string) {
  if (state === 'COMPLETE') return 'bg-success/15 text-success border border-success/30';
  if (state === 'FAILED' || state === 'CANCELED' || state === 'EXPIRED') return 'bg-destructive/15 text-destructive border border-destructive/30';
  if (state === 'PROOF_SUBMITTED') return 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse';
  if (state === 'VERIFIED') return 'bg-success/10 text-success border border-success/20 animate-pulse';
  if (state === 'FUNDED') return 'bg-primary/15 text-primary border border-primary/30 animate-pulse';
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

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const { intents } = await orchestratorApi.listIntents();
      setActivities(intents);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, []);

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
          {selectedActivity && <IntentDetail intent={selectedActivity} userEmail={user?.email || null} privacyMode={privacyMode} onUpdate={load} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Intent Detail (shown in sheet) ──────────────────────────────────────────

function IntentDetail({ intent, userEmail, privacyMode, onUpdate }: {
  intent: OrchestratorIntent;
  userEmail: string | null;
  privacyMode: boolean;
  onUpdate: () => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [proofVerified, setProofVerified] = useState<boolean | null>(null);
  const isAdmin = userEmail ? ADMIN_EMAILS.includes(userEmail.toLowerCase()) : false;

  useEffect(() => {
    if (!intent.proofHash) return;
    orchestratorApi.getIntent(intent.id)
      .then(({ proofs }) => {
        if (proofs && proofs.length > 0) {
          setProofVerified(proofs.some(p => p.verified));
        }
      })
      .catch(() => null);
  }, [intent.id, intent.proofHash]);
  const canVerify = isAdmin && intent.state !== 'COMPLETE' && intent.state !== 'FAILED' && intent.state !== 'CANCELED';

  const handleVerify = async () => {
    try {
      setVerifying(true);
      setVerifyError(null);
      await orchestratorApi.verifyAndRelease(intent.id);
      onUpdate();
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : 'Verify failed');
    } finally {
      setVerifying(false);
    }
  };

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex justify-between border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );

  const TxLink = ({ hash }: { hash: string }) => (
    <a
      href={txUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs"
    >
      {hash.slice(0, 8)}…{hash.slice(-6)}
      <ExternalLink className="h-3 w-3" />
    </a>
  );

  return (
    <div className="mt-6 space-y-4 text-sm">
      <Row label="Intent ID">
        <span className="font-mono text-xs">{intent.id.slice(0, 12)}…</span>
      </Row>
      <Row label="Type">{formatType(intent.type)}</Row>
      <Row label="State">
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide', stateBadgeClass(intent.state))}>
          {stateLabel(intent.state)}
        </span>
      </Row>
      <Row label="Amount">
        <span className={cn(privacyMode && 'privacy-blur')}>{intent.amount} {intent.sourceAsset}</span>
      </Row>
      <Row label="Target asset">{intent.targetAsset}</Row>
      {intent.rail && <Row label="Rail">{intent.rail}</Row>}
      {intent.paymentHandle && <Row label="Handle">{intent.paymentHandle}</Row>}
      {intent.depositTxHash && (
        <Row label="Deposit Tx"><TxLink hash={intent.depositTxHash} /></Row>
      )}
      {intent.releaseTxHash && (
        <Row label="Release Tx"><TxLink hash={intent.releaseTxHash} /></Row>
      )}
      {intent.escrowId && <Row label="Escrow ID"><span className="font-mono text-xs">{intent.escrowId}</span></Row>}
      {intent.escrowId && intent.depositTxHash && (
        <Row label="Escrow Status">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-primary/15 text-primary border border-primary/30">
            <ShieldCheck className="h-2.5 w-2.5" /> Funded
          </span>
        </Row>
      )}
      {(() => {
        try {
          const meta = JSON.parse(intent.metaJson || '{}');
          if (!meta.payer && !meta.payee) return null;
          return (
            <>
              {meta.payer && <Row label="Payer (LP)"><span className="font-mono text-xs">{(meta.payer as string).slice(0, 8)}…{(meta.payer as string).slice(-6)}</span></Row>}
              {meta.payee && <Row label="Payee (You)"><span className="font-mono text-xs">{(meta.payee as string).slice(0, 8)}…{(meta.payee as string).slice(-6)}</span></Row>}
            </>
          );
        } catch { return null; }
      })()}
      {intent.proofHash && (
        <Row label="Proof Hash">
          <span className="inline-flex items-center gap-1">
            {proofVerified === true && <ShieldCheck className="h-3.5 w-3.5 text-success" />}
            {proofVerified === false && <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="font-mono text-xs text-primary">
              {intent.proofHash.slice(0, 10)}…{intent.proofHash.slice(-6)}
            </span>
          </span>
        </Row>
      )}
      {intent.proofHash && proofVerified !== null && (
        <Row label="Proof Status">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase',
            proofVerified
              ? 'bg-success/15 text-success border border-success/30'
              : 'bg-muted/30 text-muted-foreground border border-border',
          )}>
            <Hash className="h-2.5 w-2.5" />
            {proofVerified ? 'Verified' : 'Pending admin review'}
          </span>
        </Row>
      )}
      <Row label="Updated">{new Date(intent.updatedAt).toLocaleString()}</Row>
      <Row label="Created">{new Date(intent.createdAt).toLocaleString()}</Row>

      {/* Admin: Verify + Release */}
      {canVerify && (
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Admin action
          </p>
          {verifyError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{verifyError}</span>
            </div>
          )}
          <Button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {verifying ? 'Verifying & Releasing…' : 'Verify + Release Escrow'}
          </Button>
        </div>
      )}
    </div>
  );
}
