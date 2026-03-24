// ─── XRamp Command Parser ─────────────────────────────────────────────────────
// Deterministic, regex-based parser. No LLM. Returns a structured XRampCommand
// or a typed error with the reason for the failure.
//
// Supported patterns:
//   fund lfj with $50
//   fund wallet with $100
//   fund agent wallet with $50
//   fund 0xABC... with $100
//   send $25 to 0xABC...
//   send 25 USDC to 0xABC...
//   send $50 to lfj
//   cash out $100
//   cashout $100
//   buy $50
//   buy $50 with revolut
//   buy $50 usdc
//
// Provider can be specified optionally at the end: "... with revolut/venmo/wise"

import { type XRampCommand, type XRampDestination } from '@/lib/xrampCommandEngine';

// ─── Well-known destinations ───────────────────────────────────────────────────

const DEMO_WALLET = '0x0000000000000000000000000000000000000001';

interface KnownApp {
  app: string;
  label: string;
  chainId: number;
  token: string;
  recipientAddress: string;
}

const KNOWN_APPS: KnownApp[] = [
  {
    app: 'lfj',
    label: 'LFJ',
    chainId: 43113,
    token: 'USDC',
    recipientAddress: DEMO_WALLET,
  },
  {
    app: 'agent',
    label: 'Agent Wallet',
    chainId: 43113,
    token: 'USDC',
    recipientAddress: DEMO_WALLET,
  },
];

function resolveApp(name: string): KnownApp | null {
  const lower = name.toLowerCase().trim();
  return KNOWN_APPS.find(a => lower === a.app || lower.includes(a.app)) ?? null;
}

// ─── Provider extraction ───────────────────────────────────────────────────────

type KnownProvider = 'revolut' | 'venmo' | 'wise';

function extractProvider(text: string): KnownProvider | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('revolut')) return 'revolut';
  if (lower.includes('venmo')) return 'venmo';
  if (lower.includes('wise')) return 'wise';
  return undefined;
}

// ─── Amount extraction ─────────────────────────────────────────────────────────

function extractAmount(text: string): number | null {
  const m = text.match(/\$?([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1].replace(',', ''));
  return isNaN(v) || v <= 0 ? null : v;
}

// ─── Address detection ─────────────────────────────────────────────────────────

function extractAddress(text: string): string | null {
  const m = text.match(/0x[0-9a-fA-F]{40,}/);
  return m ? m[0] : null;
}

// ─── Parse result ──────────────────────────────────────────────────────────────

export interface ParseSuccess {
  ok: true;
  command: XRampCommand;
  /** Human-readable label for what was parsed, shown in preview */
  label: string;
}

export interface ParseFailure {
  ok: false;
  reason: string;
}

export type ParseResult = ParseSuccess | ParseFailure;

// ─── Main parser ───────────────────────────────────────────────────────────────

export function parseCommand(raw: string): ParseResult {
  const text = raw.trim();
  if (!text) return { ok: false, reason: 'Empty command.' };

  const lower = text.toLowerCase();
  const provider = extractProvider(text);

  // ── cash out / cashout ─────────────────────────────────────────────────────
  if (/^cash[\s-]?out/i.test(lower)) {
    const amount = extractAmount(text);
    if (!amount) return { ok: false, reason: 'Specify an amount, e.g. "cash out $100".' };
    return {
      ok: true,
      label: `Cash out $${amount}`,
      command: {
        action: 'send_p2p',
        amount: String(amount),
        provider,
        destination: {
          chainId: 43113,
          token: 'USDC',
          recipientAddress: DEMO_WALLET,
          memo: 'cashout',
        },
      },
    };
  }

  // ── fund <target> with $N ──────────────────────────────────────────────────
  const fundMatch = lower.match(/^fund\s+(.+?)\s+with\s+\$?([\d,]+(?:\.\d+)?)/);
  if (fundMatch) {
    const targetRaw = fundMatch[1].trim();
    const amount = parseFloat(fundMatch[2].replace(',', ''));
    if (isNaN(amount) || amount <= 0) return { ok: false, reason: 'Invalid amount.' };

    const address = extractAddress(targetRaw);
    const app = resolveApp(targetRaw);

    let destination: XRampDestination;
    let label: string;

    if (address) {
      destination = { chainId: 43113, token: 'USDC', recipientAddress: address };
      label = `Fund ${address.slice(0, 6)}…${address.slice(-4)} with $${amount}`;
    } else if (app) {
      destination = { chainId: app.chainId, token: app.token, recipientAddress: app.recipientAddress, app: app.app };
      label = `Fund ${app.label} with $${amount}`;
    } else if (targetRaw.includes('wallet')) {
      destination = { chainId: 43113, token: 'USDC', recipientAddress: DEMO_WALLET, memo: 'wallet' };
      label = `Fund wallet with $${amount}`;
    } else {
      return { ok: false, reason: `Unknown destination "${targetRaw}". Try "lfj", "wallet", or an address.` };
    }

    return { ok: true, label, command: { action: 'fund_destination', amount: String(amount), provider, destination } };
  }

  // ── send $N to <target> / send N TOKEN to <target> ─────────────────────────
  const sendMatch = lower.match(/^send\s+\$?([\d,]+(?:\.\d+)?)\s*([a-z]*)?\s+to\s+(.+)/);
  if (sendMatch) {
    const amount = parseFloat(sendMatch[1].replace(',', ''));
    if (isNaN(amount) || amount <= 0) return { ok: false, reason: 'Invalid amount.' };
    const targetRaw = sendMatch[3].trim();

    const address = extractAddress(targetRaw);
    const app = resolveApp(targetRaw);

    let destination: XRampDestination;
    let label: string;

    if (address) {
      destination = { chainId: 43113, token: 'USDC', recipientAddress: address };
      label = `Send $${amount} to ${address.slice(0, 6)}…${address.slice(-4)}`;
    } else if (app) {
      destination = { chainId: app.chainId, token: app.token, recipientAddress: app.recipientAddress, app: app.app };
      label = `Send $${amount} to ${app.label}`;
    } else if (targetRaw.includes('wallet')) {
      destination = { chainId: 43113, token: 'USDC', recipientAddress: DEMO_WALLET, memo: 'wallet' };
      label = `Send $${amount} to wallet`;
    } else {
      return { ok: false, reason: `Unknown destination "${targetRaw}". Try an address or "lfj".` };
    }

    return { ok: true, label, command: { action: 'send_p2p', amount: String(amount), provider, destination } };
  }

  // ── buy $N [TOKEN] [with PROVIDER] ────────────────────────────────────────
  if (/^buy\s/i.test(lower)) {
    const amount = extractAmount(text);
    if (!amount) return { ok: false, reason: 'Specify an amount, e.g. "buy $50".' };
    return {
      ok: true,
      label: `Buy $${amount} USDC`,
      command: {
        action: 'fund_destination',
        amount: String(amount),
        provider,
        destination: {
          chainId: 43113,
          token: 'USDC',
          recipientAddress: DEMO_WALLET,
          memo: 'buy',
        },
      },
    };
  }

  return {
    ok: false,
    reason: 'Command not recognised. Try: "fund lfj with $50", "send $25 to 0x…", "cash out $100".',
  };
}
