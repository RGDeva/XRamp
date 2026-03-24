import { useState, useEffect } from 'react';
import { Zap, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { orchestratorApi, type OrchestratorQuote } from '@/lib/orchestratorApi';

export type { OrchestratorQuote };

interface QuotesCardProps {
  payAmount: string;
  payCurrency: string;
  receiveCrypto: string;
  destination?: {
    chainId: number;
    token: string;
    recipientAddress: string;
    app?: string;
    memo?: string;
  } | null;
  selectedQuoteId?: string | null;
  onSelect?: (quote: OrchestratorQuote) => void;
  /** Legacy compat — ignored if onSelect is provided */
  rail?: string;
}

function sourceBadge(source?: string) {
  if (source === 'peer_lp') {
    return (
      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
        Peer P2P
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
      XRamp LP
    </span>
  );
}

export function QuotesCard({
  payAmount,
  payCurrency,
  receiveCrypto,
  destination,
  selectedQuoteId,
  onSelect,
}: QuotesCardProps) {
  const num = parseFloat(payAmount) || 0;
  const [quotes, setQuotes] = useState<OrchestratorQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (num <= 0) { setQuotes([]); return; }
    let cancelled = false;
    setLoading(true);
    orchestratorApi.getQuotes({
      fiatAmount: payAmount,
      fiatCurrency: payCurrency || 'USD',
      destination: destination ?? undefined,
    }).then(res => {
      if (!cancelled) {
        setQuotes(res.quotes);
        if (res.quotes.length > 0 && onSelect && !selectedQuoteId) {
          const best = res.quotes.find(q => q.isBest) ?? res.quotes[0];
          onSelect(best);
        }
      }
    }).catch(() => {
      if (!cancelled) setQuotes([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payAmount, payCurrency, fetchKey]);

  if (num <= 0) return null;

  const best = quotes.find(q => q.isBest) ?? quotes[0];
  const selected = quotes.find(q => q.id === selectedQuoteId) ?? best;
  const displayToken = receiveCrypto || 'USDC';
  const visibleQuotes = expanded ? quotes : quotes.slice(0, 1);

  return (
    <div className="w-full rounded-2xl bg-card border border-primary/20 shadow-[0_4px_24px_rgba(0,0,0,0.18)] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary fill-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
            {loading ? 'Fetching quotes…' : quotes.length > 0 ? 'Best Route' : 'No quotes'}
          </span>
        </div>
        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
          Avalanche · Fuji
        </span>
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div className="h-12 rounded-xl bg-secondary/40 animate-pulse" />
      )}

      {/* Quote rows */}
      {!loading && visibleQuotes.map(q => {
        const isSelected = q.id === (selectedQuoteId ?? best?.id);
        return (
          <button
            key={q.id}
            onClick={() => onSelect?.(q)}
            className={cn(
              'w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left',
              isSelected
                ? 'border-primary/50 bg-primary/8'
                : 'border-border/50 bg-secondary/30 hover:border-primary/30 hover:bg-primary/5'
            )}
          >
            {/* Selection indicator */}
            <div className={cn(
              'h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
              isSelected ? 'border-primary' : 'border-border'
            )}>
              {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>

            {/* Provider + source */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground capitalize">{q.provider}</span>
                {q.isBest && (
                  <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-primary/20 text-primary">Best</span>
                )}
                {sourceBadge(q.source)}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {(q.feeBps / 100).toFixed(2)}% fee · ~{Math.round(q.etaSeconds / 60)}m
                </span>
              </div>
            </div>

            {/* Output amount */}
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold text-success">
                {parseFloat(q.outputAmount).toFixed(2)} {displayToken}
              </div>
              <div className="text-[10px] text-muted-foreground">
                −${parseFloat(q.feeAmount).toFixed(2)} fee
              </div>
            </div>
          </button>
        );
      })}

      {/* Expand/collapse toggle */}
      {!loading && quotes.length > 1 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors py-0.5"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> Show less</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> {quotes.length - 1} more route{quotes.length > 2 ? 's' : ''}</>
          )}
        </button>
      )}

      {/* Selected summary */}
      {!loading && selected && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span>
            You receive{' '}
            <span className="font-semibold text-success">
              {parseFloat(selected.outputAmount).toFixed(2)} {displayToken}
            </span>
            {' '}via{' '}
            <span className="text-foreground capitalize">{selected.provider}</span>
            {selected.source === 'peer_lp' && (
              <span className="text-violet-400"> (P2P)</span>
            )}
          </span>
          <button
            onClick={() => { setFetchKey(k => k + 1); }}
            className="ml-auto text-[10px] text-primary/60 hover:text-primary transition-colors"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
