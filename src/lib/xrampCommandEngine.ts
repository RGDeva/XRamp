// ─── XRamp Command Engine ─────────────────────────────────────────────────────
// Structured command execution layer for programmatic onramp control.
// Called by UI today; designed to be called by AI agents, WhatsApp bots,
// or any future automation layer — the interface stays the same.
//
// Usage (UI):
//   const engine = createCommandEngine({ sdk });
//   await engine.executeCommand({ action: 'fund_destination', amount: '50', destination: {...} });
//
// Usage (future agent/bot):
//   const preview = await engine.prepareCommand(cmd);  // show user quotes
//   const result  = await engine.executeCommand(cmd);  // launch flow

import { orchestratorApi, type OrchestratorQuote } from '@/lib/orchestratorApi';
import { type XRampSdk } from '@/lib/xrampSdk';

// ─── Command Schema ────────────────────────────────────────────────────────────

export type XRampCommandAction = 'fund_destination' | 'send_p2p';

export interface XRampDestination {
  chainId: number;
  token: string;
  recipientAddress: string;
  app?: string;
  memo?: string;
}

export interface XRampCommand {
  action: XRampCommandAction;
  amount: string;
  /** Optionally force a specific provider; otherwise best quote is chosen. */
  provider?: 'revolut' | 'venmo' | 'wise';
  destination: XRampDestination;
}

// ─── Prepare result ────────────────────────────────────────────────────────────

export interface CommandPreview {
  command: XRampCommand;
  quotes: OrchestratorQuote[];
  recommended: OrchestratorQuote | null;
  bestQuoteId: string | null;
}

// ─── Execute result ────────────────────────────────────────────────────────────

export interface CommandResult {
  quoteId: string | null;
  provider: string;
  outputAmount: string;
}

// ─── Engine interface ──────────────────────────────────────────────────────────

export interface CommandEngine {
  /**
   * Fetch quotes and select the recommended route.
   * Call before executeCommand to show a preview / let user confirm.
   */
  prepareCommand(command: XRampCommand): Promise<CommandPreview>;

  /**
   * Execute: fetch best route, then trigger sdk.onramp().
   * Resolves once the extension flow has been launched.
   * Listen to sdk.onIntentFulfilled for the completion event.
   */
  executeCommand(command: XRampCommand): Promise<CommandResult>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createCommandEngine(opts: { sdk: XRampSdk | null }): CommandEngine {
  const { sdk } = opts;

  async function prepareCommand(command: XRampCommand): Promise<CommandPreview> {
    const res = await orchestratorApi.getQuotes({
      fiatAmount: command.amount,
      fiatCurrency: 'USD',
      destination: command.destination,
      enabledProviders: command.provider
        ? [command.provider]
        : ['revolut', 'venmo', 'wise'],
    });

    const recommended =
      (command.provider
        ? res.quotes.find(q => q.provider === command.provider)
        : res.quotes.find(q => q.isBest)) ??
      res.quotes[0] ??
      null;

    return {
      command,
      quotes: res.quotes,
      recommended,
      bestQuoteId: res.bestQuoteId,
    };
  }

  async function executeCommand(command: XRampCommand): Promise<CommandResult> {
    if (!sdk) throw new Error('XRamp extension not available');

    const preview = await prepareCommand(command);
    const chosen = preview.recommended;
    if (!chosen) throw new Error('No route available for this command');

    sdk.onramp({
      amount: command.amount,
      provider: chosen.provider,
      destination: command.destination,
      asset: command.destination.token,
      quoteId: chosen.id,
    });

    return {
      quoteId: chosen.id,
      provider: chosen.provider,
      outputAmount: chosen.outputAmount,
    };
  }

  return { prepareCommand, executeCommand };
}

// ─── Completion message helper ─────────────────────────────────────────────────

/**
 * Format a human-readable result message from a completed command.
 * Works for UI banners, AI agent responses, and WhatsApp messages alike.
 *
 * Example outputs:
 *   "$50.00 funded via Revolut → LFJ on USDC"
 *   "$50.00 funded via Venmo → 0xaBcD…1234 on USDC"
 */
export function formatCompletionMessage(params: {
  amount: string;
  provider: string;
  destination?: XRampDestination | null;
}): string {
  const { amount, provider, destination } = params;
  const num = parseFloat(amount);
  const amountStr = isNaN(num) ? amount : `$${num.toFixed(2)}`;
  const target = destination?.app
    ? destination.app.toUpperCase()
    : destination?.recipientAddress
    ? `${destination.recipientAddress.slice(0, 6)}…${destination.recipientAddress.slice(-4)}`
    : 'destination';
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
  const token = destination?.token ?? 'USDC';
  return `${amountStr} funded via ${providerLabel} → ${target} on ${token}`;
}
