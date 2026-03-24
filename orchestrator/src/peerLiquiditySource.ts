// ─── Peer/ZKP2P Liquidity Source Adapter ─────────────────────────────────────
// Fetches live P2P quotes from the Peer protocol indexer REST API and
// normalises them into XRamp's internal quote format.
//
// API target: https://api.peer.xyz/v1/quotes  (Peer indexer, V3 protocol)
// Docs:       https://docs.peer.xyz/developer/integrate-zkp2p/integrate-redirect-onramp
//
// Failure mode: if the Peer API is unreachable, rate-limited, or returns no
// usable quotes, this adapter returns [] and the caller continues with XRamp LP
// quotes. It NEVER throws — all errors are caught and logged.
//
// Quote normalisation:
//   Peer quote output is denominated in the destination token (USDC by default).
//   We convert to the same shape as XRamp internal quotes so they can be ranked
//   together by outputAmount / etaSeconds.

// ─── Types ────────────────────────────────────────────────────────────────────

/** Fields we send to the Peer indexer. */
export interface PeerQuoteRequest {
  /** Payment platforms to include, e.g. ['venmo', 'revolut', 'wise'] */
  paymentPlatforms: string[];
  /** ISO-4217 fiat currency, e.g. 'USD' */
  fiatCurrency: string;
  /** Taker (buyer) address */
  user: string;
  /** On-chain recipient address */
  recipient: string;
  /** EVM chain ID for the destination, e.g. 43113 (Avalanche Fuji) */
  destinationChainId: number;
  /** ERC-20 token address on destination chain, or zero address for native */
  destinationToken: string;
  /** Fiat amount the user wants to spend, as a string (e.g. '50') */
  amount: string;
  /** Max number of quotes to return (default 5) */
  quotesToReturn?: number;
  /** True = amount is exact fiat spend; false = exact crypto output */
  isExactFiat?: boolean;
  /** Include nearby quotes outside strict filters */
  includeNearbyQuotes?: boolean;
}

/** Raw quote object returned by the Peer indexer. */
interface PeerRawQuote {
  quoteId: string;
  depositId?: string;
  paymentPlatform: string;
  /** Amount of destination token the taker receives (in token-native decimals) */
  outputAmount: string;
  /** Fiat amount required from taker */
  inputAmount?: string;
  /** Fee charged (in destination token units) */
  feeAmount?: string;
  /** Estimated settlement seconds */
  estimatedSettlementTime?: number;
  /** Maker/depositor address */
  depositor?: string;
}

/** Peer indexer response envelope. */
interface PeerQuoteResponse {
  quotes?: PeerRawQuote[];
  nearbySuggestions?: PeerRawQuote[];
  signalIntentAmount?: string;
  referrerFeeAmount?: string;
}

/** XRamp-normalised quote ready for ranking and return from POST /quotes. */
export interface NormalisedPeerQuote {
  id: string;
  provider: string;
  outputAmount: string;
  feeAmount: string;
  feeBps: number;
  etaSeconds: number;
  routeType: 'peer_lp';
  source: 'peer_lp';
  isBest: boolean;
  fiatCurrency: string;
  destination: Record<string, unknown> | null;
  /** Raw depositor address for traceability */
  depositor?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PEER_API_BASE = 'https://api.peer.xyz/v1';
const PEER_QUOTE_TIMEOUT_MS = 4000; // hard timeout — keep /quotes fast

// USDC has 6 decimals on EVM chains
const USDC_DECIMALS = 1_000_000;

// Approximate ETA per platform (seconds) — used when Peer doesn't return one
const PLATFORM_ETA_FALLBACK: Record<string, number> = {
  venmo:   60,
  revolut: 90,
  wise:    180,
  cashapp: 90,
  zelle:   45,
};

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * Fetch live Peer LP quotes for a funding request.
 * Returns [] on any error — callers must handle graceful degradation.
 */
export async function fetchPeerQuotes(
  req: PeerQuoteRequest,
  fiatAmount: number,
  destination: Record<string, unknown> | null,
): Promise<NormalisedPeerQuote[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PEER_QUOTE_TIMEOUT_MS);

  try {
    const res = await fetch(`${PEER_API_BASE}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[PeerLP] HTTP ${res.status} from Peer indexer — skipping`);
      return [];
    }

    const data: PeerQuoteResponse = await res.json();
    const raw = [...(data.quotes ?? []), ...(data.nearbySuggestions ?? [])];

    if (raw.length === 0) return [];

    return raw.flatMap((q): NormalisedPeerQuote[] => {
      // outputAmount from Peer is in token units (USDC = 6 decimals)
      const outputRaw = parseFloat(q.outputAmount ?? '0');
      if (isNaN(outputRaw) || outputRaw <= 0) return [];

      // Normalise to human-readable USDC units
      const outputUsdc = outputRaw > 1000 ? outputRaw / USDC_DECIMALS : outputRaw;

      // Fee
      const feeRaw = parseFloat(q.feeAmount ?? '0');
      const feeUsdc = feeRaw > 1000 ? feeRaw / USDC_DECIMALS : feeRaw;

      // feeBps derived from fee / fiatAmount
      const feeBps = fiatAmount > 0
        ? Math.round((feeUsdc / fiatAmount) * 10000)
        : 0;

      const eta = q.estimatedSettlementTime ??
        PLATFORM_ETA_FALLBACK[q.paymentPlatform?.toLowerCase()] ??
        120;

      return [{
        id: `peer-${q.quoteId ?? q.depositId ?? Math.random().toString(36).slice(2)}`,
        provider: q.paymentPlatform?.toLowerCase() ?? 'peer',
        outputAmount: outputUsdc.toFixed(6),
        feeAmount: feeUsdc.toFixed(6),
        feeBps,
        etaSeconds: eta,
        routeType: 'peer_lp',
        source: 'peer_lp',
        isBest: false,
        fiatCurrency: req.fiatCurrency,
        destination,
        depositor: q.depositor,
      }];
    });

  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[PeerLP] Timeout fetching Peer quotes — skipping');
    } else {
      console.warn('[PeerLP] Error fetching Peer quotes:', err);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Build a PeerQuoteRequest from XRamp /quotes input parameters.
 * Uses the zero address as the user/recipient placeholder when not provided.
 */
export function buildPeerQuoteRequest(params: {
  fiatAmount: string;
  fiatCurrency: string;
  paymentPlatforms: string[];
  destination?: Record<string, unknown> | null;
}): PeerQuoteRequest {
  const { fiatAmount, fiatCurrency, paymentPlatforms, destination } = params;

  const recipientAddress = (destination?.recipientAddress as string | undefined)
    ?? '0x0000000000000000000000000000000000000000';
  const chainId = (destination?.chainId as number | undefined) ?? 8453; // Base mainnet default
  // For Peer, destinationToken = USDC address on Base; we use zero addr as placeholder
  const destinationToken = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

  return {
    paymentPlatforms,
    fiatCurrency: fiatCurrency.toUpperCase(),
    user: '0x0000000000000000000000000000000000000000',
    recipient: recipientAddress,
    destinationChainId: chainId,
    destinationToken,
    amount: fiatAmount,
    quotesToReturn: 5,
    isExactFiat: true,
    includeNearbyQuotes: true,
  };
}
