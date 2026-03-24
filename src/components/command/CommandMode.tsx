import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X, Zap, CheckCircle2, Clock, TrendingUp, Wifi, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { createCommandEngine, formatCompletionMessage, type CommandPreview } from '@/lib/xrampCommandEngine';
import { parseCommand } from '@/lib/xrampCommandParser';
import { createXRampSdk } from '@/lib/xrampSdk';

// ─── XRamp LP stats (static, demo) ──────────────────────────────────────────

const XRAMP_LP = { reliability: 99, avgTime: '~2 min', fillRate: 100 };

// ─── Message Types ───────────────────────────────────────────────────────────

type MsgRole = 'system' | 'user' | 'info' | 'success' | 'timer';

interface Msg {
  id: string;
  role: MsgRole;
  text: string;
  ts: number;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
// Each chip either sets a template in the input box or fires directly.

interface QuickAction {
  label: string;
  command: string;
  fire?: boolean; // if true, execute immediately; else just populate input
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Fund LFJ $50',        command: 'fund lfj with $50',          fire: true },
  { label: 'Fund wallet $100',    command: 'fund wallet with $100',      fire: true },
  { label: 'Send $25 to address', command: 'send $25 to ',               fire: false },
  { label: 'Cash out $100',       command: 'cash out $100',              fire: true },
  { label: 'Buy $50',             command: 'buy $50 with revolut',       fire: true },
  { label: 'Fund agent $50',      command: 'fund agent wallet with $50', fire: true },
];

// ─── SLA Countdown Component ──────────────────────────────────────────────────

function SLATimer({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const doneRef = useRef(false);

  useEffect(() => {
    if (remaining <= 0) {
      if (!doneRef.current) { doneRef.current = true; onComplete(); }
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onComplete]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <span className="font-mono text-amber-400">
      Waiting for fiat confirmation ({mm}:{ss})
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CommandMode() {
  const { user } = useAuth();

  // ── SDK + command engine ───────────────────────────────────────────────────
  const sdkRef = useRef(createXRampSdk({ window }));
  const engineRef = useRef(createCommandEngine({ sdk: sdkRef.current }));

  // ── State ──────────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: 'system',
      text: 'XRamp Command ready. Type a command or tap a quick action to fund on-chain.',
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showLP, setShowLP] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<CommandPreview | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const push = useCallback((role: MsgRole, text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role, text, ts: Date.now() }]);
  }, []);

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingPreview, minimized]);

  // ── Listen for extension completion ───────────────────────────────────────
  useEffect(() => {
    const sdk = sdkRef.current;
    const unsub = sdk.onIntentFulfilled((data) => {
      setOpen(true);
      setMinimized(false);
      setPendingPreview(null);
      setBusy(false);
      push('success', formatCompletionMessage({
        amount: data.amount,
        provider: data.rail,
        destination: data.destination,
      }));
      if (data.destination?.app === 'lfj') {
        push('info', 'Open LFJ to continue: https://lfj.gg');
      }
    });
    return () => { unsub(); sdk.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [push]);

  // ── Parse → preview flow ───────────────────────────────────────────────────
  const runCommand = useCallback(async (text: string) => {
    if (busy) return;
    setBusy(true);
    setMinimized(false);
    setPendingPreview(null);

    push('user', text);
    await delay(200);

    const parsed = parseCommand(text);
    if (!parsed.ok) {
      push('info', `⚠ ${parsed.reason}`);
      setBusy(false);
      return;
    }

    push('info', `Fetching best route for "${parsed.label}"…`);
    setShowLP(true);

    try {
      const preview = await engineRef.current.prepareCommand(parsed.command);
      if (!preview.recommended) {
        push('info', '⚠ No route available right now. Try again shortly.');
        setBusy(false);
        return;
      }
      setPendingPreview(preview);
    } catch {
      push('info', '⚠ Could not fetch quotes — check connection.');
    }
    setBusy(false);
  }, [busy, push]);

  // ── Confirm execution ──────────────────────────────────────────────────────
  const confirmExecution = useCallback(async () => {
    if (!pendingPreview || busy) return;
    setBusy(true);
    const cmd = pendingPreview.command;
    const route = pendingPreview.recommended!;
    const providerLabel = route.provider.charAt(0).toUpperCase() + route.provider.slice(1);
    push('info', `Launching ${providerLabel} flow for $${cmd.amount}…`);
    setPendingPreview(null);
    try {
      await engineRef.current.executeCommand(cmd);
      push('info', 'Extension opened — complete the payment to finish.');
    } catch (e) {
      push('info', `⚠ ${e instanceof Error ? e.message : 'Extension not available. Install XRamp extension.'}`);
    }
    setBusy(false);
  }, [pendingPreview, busy, push]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setInput('');
    runCommand(trimmed);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const unreadCount = !open ? messages.filter(m => m.role !== 'system' || messages.indexOf(m) > 0).length : 0;

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 flex flex-col items-end gap-2">
      {/* ── Expanded Chat Window (expands upward) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'flex flex-col rounded-2xl overflow-hidden',
              'w-[320px] sm:w-[360px]',
              'bg-[rgba(10,13,20,0.96)] backdrop-blur-xl',
              'border border-border/60',
              'shadow-[0_8px_40px_rgba(0,0,0,0.6)]',
              minimized ? 'h-auto' : 'h-[480px]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground leading-none">XRamp Command</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Intent-based · Avalanche</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimized((m) => !m)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  title={minimized ? 'Expand' : 'Minimise'}
                >
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Body — hidden when minimized */}
            {!minimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                  {messages.map((msg) => (
                    <ChatBubble key={msg.id} msg={msg} />
                  ))}

                  {/* Route preview confirm card */}
                  {pendingPreview && pendingPreview.recommended && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5"
                    >
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Best Route Found</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Provider</span>
                          <span className="font-semibold text-foreground capitalize">{pendingPreview.recommended.provider}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">You receive</span>
                          <span className="font-bold text-success">{parseFloat(pendingPreview.recommended.outputAmount).toFixed(2)} {pendingPreview.command.destination.token}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Fee</span>
                          <span className="text-foreground">{(pendingPreview.recommended.feeBps / 100).toFixed(2)}% · −${parseFloat(pendingPreview.recommended.feeAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">ETA</span>
                          <span className="text-foreground">~{Math.round(pendingPreview.recommended.etaSeconds / 60)}m</span>
                        </div>
                        {pendingPreview.command.destination.app && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Destination</span>
                            <span className="font-semibold text-primary uppercase">{pendingPreview.command.destination.app}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-0.5">
                        <button
                          onClick={confirmExecution}
                          disabled={busy}
                          className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-bold transition-opacity disabled:opacity-50"
                        >
                          {busy ? 'Launching…' : 'Confirm & Fund'}
                        </button>
                        <button
                          onClick={() => setPendingPreview(null)}
                          disabled={busy}
                          className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Quick actions */}
                <div className="px-3 py-2 border-t border-border/30 flex-shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIONS.map((qa) => (
                      <button
                        key={qa.label}
                        onClick={() => {
                          if (busy) return;
                          if (qa.fire) {
                            runCommand(qa.command);
                          } else {
                            setInput(qa.command);
                          }
                        }}
                        disabled={busy}
                        className={cn(
                          'text-[10px] px-2 py-1 rounded-full border transition-all',
                          'border-primary/30 text-primary bg-primary/10 hover:bg-primary/20',
                          busy && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div className="px-3 pb-3 pt-1 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl px-3 py-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Type a command…"
                      disabled={busy}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || busy}
                      className="p-1.5 rounded-lg bg-primary/20 hover:bg-primary/40 text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* LP Stats */}
                {showLP && <LPStatsBar />}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Trigger Bubble ── */}
      <motion.button
        onClick={() => { setOpen((o) => !o); setMinimized(false); }}
        className={cn(
          'relative flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm flex-shrink-0',
          'bg-primary text-primary-foreground',
          'shadow-[0_0_20px_rgba(6,182,212,0.45)] hover:shadow-[0_0_32px_rgba(6,182,212,0.7)]',
          'transition-shadow'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
      >
        {!open && <span className="absolute inset-0 rounded-full animate-ping bg-primary/25 pointer-events-none" />}
        <Zap className="h-4 w-4 fill-current flex-shrink-0" />
        Command
        {/* Unread badge */}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: Msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-primary/20 border border-primary/30 text-sm text-foreground">
          {msg.text}
        </div>
      </div>
    );
  }

  const styles: Record<MsgRole, string> = {
    system:  'bg-secondary/40 border border-border/50 text-muted-foreground',
    info:    'bg-secondary/60 border border-border/60 text-foreground',
    success: 'bg-success/10 border border-success/30 text-success',
    timer:   'bg-amber-500/10 border border-amber-500/20 text-amber-400',
    user:    '',
  };

  const icon: Record<MsgRole, React.ReactNode> = {
    system:  <Wifi className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />,
    info:    <Clock className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />,
    success: <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0 text-success" />,
    timer:   <Clock className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-400" />,
    user:    null,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex"
    >
      <div className={cn('max-w-[90%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm flex items-start gap-2', styles[msg.role])}>
        {icon[msg.role]}
        <span>{msg.text}</span>
      </div>
    </motion.div>
  );
}

// ─── LP Stats Bar ─────────────────────────────────────────────────────────────

function LPStatsBar() {
  const display = XRAMP_LP;
  return (
    <div className="px-4 py-3 border-t border-border/30 bg-secondary/20">
      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">XRamp LP · single provider</p>
      <div className="grid grid-cols-3 gap-2">
        <StatPill
          icon={<TrendingUp className="h-3 w-3" />}
          label="Reliability"
          value={`${display.reliability}%`}
          highlight={display.reliability >= 96}
        />
        <StatPill
          icon={<Clock className="h-3 w-3" />}
          label="Avg time"
          value={display.avgTime}
        />
        <StatPill
          icon={<CheckCircle2 className="h-3 w-3" />}
          label="Fill rate"
          value={`${display.fillRate}%`}
          highlight={display.fillRate >= 97}
        />
      </div>
    </div>
  );
}

function StatPill({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-0.5 rounded-lg py-2 px-1 border',
      highlight ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-secondary/40 border-border/40 text-muted-foreground'
    )}>
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] font-semibold">{value}</span>
      </div>
      <span className="text-[9px] opacity-70">{label}</span>
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}
