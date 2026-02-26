import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X, Zap, CheckCircle2, Clock, TrendingUp, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Simulated LP Engine ────────────────────────────────────────────────────

interface LP {
  id: string;
  name: string;
  reliability: number;    // percentage
  avgTime: string;        // human-readable
  avgSeconds: number;     // for sorting
  expressEligible: boolean;
  fillRate: number;       // percentage
}

const LP_POOL: LP[] = [
  { id: 'lp_a', name: 'LP_A', reliability: 98, avgTime: '2m 10s', avgSeconds: 130, expressEligible: true,  fillRate: 99 },
  { id: 'lp_b', name: 'LP_B', reliability: 91, avgTime: '5m 40s', avgSeconds: 340, expressEligible: false, fillRate: 94 },
  { id: 'lp_c', name: 'LP_C', reliability: 96, avgTime: '3m 05s', avgSeconds: 185, expressEligible: true,  fillRate: 97 },
];

function routeLP(express: boolean): LP {
  const eligible = express
    ? LP_POOL.filter((lp) => lp.expressEligible && lp.reliability > 95)
    : [...LP_POOL];
  // Sort by reliability desc, then avgSeconds asc
  return eligible.sort((a, b) =>
    b.reliability - a.reliability || a.avgSeconds - b.avgSeconds
  )[0];
}

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

// ─── Quick Commands ──────────────────────────────────────────────────────────

const QUICK_COMMANDS = [
  'Buy $100 USDC with Venmo',
  'Sell $250 USDC to CashApp',
  'On-ramp $500 and swap to AVAX',
  'Express buy $200 USDC',
];

// ─── Parse intent from command string ────────────────────────────────────────

interface Intent {
  action: 'buy' | 'sell' | 'onramp';
  amount: number;
  express: boolean;
  swapToAvax: boolean;
  rail: string;
}

function parseIntent(text: string): Intent {
  const lower = text.toLowerCase();
  const amtMatch = text.match(/\$?([\d,]+)/);
  const amount = amtMatch ? parseFloat(amtMatch[1].replace(',', '')) : 100;
  const express = lower.includes('express');
  const swapToAvax = lower.includes('swap to avax') || lower.includes('avax');
  const action: Intent['action'] = lower.includes('sell') ? 'sell' : lower.includes('on-ramp') || lower.includes('onramp') ? 'onramp' : 'buy';
  const rail = lower.includes('venmo') ? 'Venmo' : lower.includes('cashapp') || lower.includes('cash app') ? 'CashApp' : lower.includes('zelle') ? 'Zelle' : 'CashApp';
  return { action, amount, express, swapToAvax, rail };
}

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
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: 'system',
      text: 'XRamp Command Mode active. Intent-based settlement on Avalanche. Type a command or tap a quick action below.',
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [slaActive, setSlaActive] = useState(false);
  const [matchedLP, setMatchedLP] = useState<LP | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const push = useCallback((role: MsgRole, text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role, text, ts: Date.now() }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, slaActive]);

  const runSimulation = useCallback(async (text: string) => {
    if (busy) return;
    setBusy(true);

    const intent = parseIntent(text);
    const lp = routeLP(intent.express);
    setMatchedLP(lp);

    // User echo
    push('user', text);

    await delay(400);

    // Express notice
    if (intent.express) {
      push('info', '⚡ Express routing enabled (+0.5% fee) — matching with top-tier liquidity provider…');
      await delay(600);
    }

    // LP match
    push('info', `Matched with ${lp.name} (${lp.reliability}% reliability, avg ${lp.avgTime})`);
    await delay(400);
    push('info', `SLA: 5 minutes`);
    await delay(300);

    // SLA timer message
    setSlaActive(true);

    // Simulate fiat arrival after 4s
    await delay(4000);
    setSlaActive(false);

    push('success', '✓ Fiat received');
    await delay(700);
    push('success', '✓ Escrow released');
    await delay(700);
    push('success', '✓ Swap executed on Avalanche (LFJ simulated)');

    // Optional AVAX swap
    if (intent.swapToAvax) {
      await delay(800);
      push('info', 'Executing swap via LFJ router…');
      await delay(1200);
      push('info', 'Transaction confirmed');
      const avaxOut = ((intent.amount * 1.01 * 0.995) / 28.5).toFixed(4);
      push('success', `✓ Received ${avaxOut} AVAX`);
    }

    await delay(300);
    push('system', `Order complete. ${intent.action === 'sell' ? 'Fiat payout' : 'Crypto'} delivered successfully.`);

    setBusy(false);
  }, [busy, push]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setInput('');
    runSimulation(trimmed);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <div className="fixed bottom-24 right-4 z-50 md:bottom-8">
        <motion.button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm',
            'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(6,182,212,0.5)]',
            'hover:shadow-[0_0_32px_rgba(6,182,212,0.7)] transition-shadow'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* pulse ring */}
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/30 pointer-events-none" />
          <Zap className="h-4 w-4 fill-current" />
          Command
        </motion.button>
      </div>

      {/* ── Side Panel ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* backdrop (mobile) */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
              className={cn(
                'fixed right-0 top-0 bottom-0 z-50 flex flex-col',
                'w-full max-w-sm',
                'bg-[rgba(10,13,20,0.92)] backdrop-blur-xl',
                'border-l border-border/60',
                'shadow-[-8px_0_40px_rgba(0,0,0,0.5)]'
              )}
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] text-success font-medium uppercase tracking-widest">Connected</span>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="px-5 py-3 border-b border-border/30">
                <h2 className="text-base font-bold text-foreground">XRamp Command Mode</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Intent-based settlement on Avalanche</p>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} />
                ))}

                {/* SLA Timer bubble */}
                {slaActive && (
                  <div className="flex">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-sm">
                      <SLATimer seconds={299} onComplete={() => setSlaActive(false)} />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* ── Quick Commands ── */}
              <div className="px-4 py-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Quick commands</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_COMMANDS.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => { if (!busy) runSimulation(cmd); }}
                      disabled={busy}
                      className={cn(
                        'text-[11px] px-2.5 py-1 rounded-full border transition-all',
                        cmd.toLowerCase().includes('express')
                          ? 'border-amber-500/50 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                          : 'border-primary/30 text-primary bg-primary/10 hover:bg-primary/20',
                        busy && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Input ── */}
              <div className="px-4 py-3 border-t border-border/50">
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
                    className="p-1.5 rounded-lg bg-primary/20 hover:bg-primary/40 text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* ── LP Stats Footer ── */}
              <LPStatsBar lp={matchedLP} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
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

function LPStatsBar({ lp }: { lp: LP | null }) {
  const display = lp ?? LP_POOL[0];
  return (
    <div className="px-4 py-3 border-t border-border/30 bg-secondary/20">
      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Active LP performance</p>
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
