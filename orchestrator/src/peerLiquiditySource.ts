// ─── Peer/ZKP2P Liquidity Source Adapter ─────────────────────────────────────
//
// ┌─ INTEGRATION STATUS ──────────────────────────────────────────────────────┐
// │ EXPERIMENTAL — disabled by default (PEER_QUOTES_ENABLED env var / flag)   │
// │                                                                            │
// │ What IS documented (docs.peer.xyz, @zkp2p/sdk):                           │
// │   • Extension SDK: peerExtensionSdk.onramp() — the browser-side flow      │
// │   • onramp() params: referrer, inputCurrency, inputAmount, paymentPlatform,│
// │     toToken, recipientAddress, amountUsdc, intentHash                     │
// │   • onIntentFulfilled() callback shape                                    │
// │   • getQuote(req, opts?) is referenced in user-provided context as a      │
// │     "Client Reference" method — but the corresponding docs page 404s and  │
// │     the @zkp2p/sdk package is NOT published to npm or available for       │
// │     server-side use in a Cloudflare Worker                                │
// │                                                                            │
// │ What is INFERRED (not documented, not verified):                          │
// │   • REST endpoint: https://api.peer.xyz/v1/quotes                         │
// │   • POST body shape: { paymentPlatforms, fiatCurrency, user, recipient,   │
// │     destinationChainId, destinationToken, amount, quotesToReturn,          │
// │     isExactFiat, includeNearbyQuotes }                                    │
// │   • Response shape: { quotes[], nearbySuggestions[], signalIntentAmount,  │
// │     referrerFeeAmount }                                                    │
// │   • Per-quote fields: quoteId, paymentPlatform, outputAmount, feeAmount,  │
// │     estimatedSettlementTime, depositor                                    │
// │                                                                            │
// │ These field names are plausible from protocol architecture and the         │
// │ extension SDK's onramp param shape, but have NOT been validated against   │
// │ a live response. The endpoint may not exist, may require authentication,  │
// │ or may have a different shape entirely.                                   │
// │                                                                            │
// │ Failure mode: fetchPeerQuotes() NEVER throws. On any error (network,      │
// │ timeout, bad shape, disabled flag) it returns [] with a diagnostic log.   │
// │ XRamp LP quotes are always served regardless.                             │
// └────────────────────────────────────────────────────────────────────────────┘

// ─── Feature flag ─────────────────────────────────────────────────────────────
// Set PEER_QUOTES_ENABLED=true in wrangler.toml vars or pass enabled:true to
// fetchPeerQuotes() once the endpoint is verified. Default: false (disabled).
export const PEER_QUOTES_ENABLED_DEFAULT = false;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Fields sent to the Peer indexer.
 *
 * Source: inferred from extension SDK onramp() param shape + protocol docs.
 * NOT verified against a live endpoint response.
 */
export interface PeerQuoteRequest {
  /** [INFERRED] Payment platforms to include, e.g. ['venmo', 'revolut'] */
  paymentPlatforms: string[];
  /** [INFERRED] ISO-4217 fiat currency, e.g. 'USD' */
  fiatCurrency: string;
  /** [INFERRED] Taker (buyer) wallet address */
  user: string;
  /** [INFERRED] On-chain recipient address */
  recipient: string;
  /** [INFERRED] EVM chain ID for destination */
  destinationChainId: number;
  /** [INFERRED] ERC-20 token address on destination chain */
  destinationToken: string;
  /** [INFERRED] Fiat amount user wants to spend */
  amount: string;
  /** [INFERRED] Max quotes to return */
  quotesToReturn?: number;
  /** [INFERRED] true = exact fiat spend */
  isExactFiat?: boolean;
  /** [INFERRED] Include nearby/relaxed quotes */
  includeNearbyQuotes?: boolean;
}

/**
 * Raw quote from the Peer indexer — shape is INFERRED, not verified.
 * Fields marked optional because we cannot guarantee they exist.
 */
interface PeerRawQuote {
  quoteId?: string;
  depositId?: string;
  paymentPlatform?: string;
  outputAmount?: string;
  inputAmount?: string;
  feeAmount?: string;
  estimatedSettlementTime?: number;
  depositor?: string;
  // Catch-all for unexpected fields
  [key: string]: unknown;
}

/**
 * Response envelope from the Peer indexer — shape is INFERRED, not verified.
 * All fields optional to handle unexpected response shapes gracefully.
 */
interface PeerQuoteResponse {
  quotes?: PeerRawQuote[];
  nearbySuggestions?: PeerRawQuote[];
  signalIntentAmount?: string;
  referrerFeeAmount?: string;
  // Catch-all
  [key: string]: unknown;
}

/** XRamp-normalised quote, ready for ranking alongside XRamp LP quotes. */
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
  depositor?: string;
}

/** Diagnostic info returned alongside quotes for internal logging. */
export interface PeerFetchDiagnostics {
  enabled: boolean;
  requestedPlatforms: string[];
  httpStatus?: number;
  rawQuoteCount: number;
  normalisedCount: number;
  skippedCount: number;
  fallbackReason?: string;
  durationMs: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// INFERRED — not verified to exist or accept this path
const PEER_API_BASE = 'https://api.peer.xyz/v1';
const PEER_QUOTE_TIMEOUT_MS = 3000;

// USDC has 6 decimals on EVM chains
const USDC_DECIMALS = 1_000_000;

// ETA fallback per platform (seconds) when Peer doesn't return one
const PLATFORM_ETA_FALLBACK: Record<string, number> = {
  venmo:   60,
  revolut: 90,
  wise:    180,
  cashapp: 90,
  zelle:   45,
};

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * Attempt to fetch live Peer LP quotes.
 *
 * @param req         - Peer quote request (inferred shape)
 * @param fiatAmount  - Numeric fiat amount for feeBps calculation
 * @param destination - XRamp destination object
 * @param enabled     - Feature flag; defaults to PEER_QUOTES_ENABLED_DEFAULT
 *
 * Returns [] + diagnostics on any failure. NEVER throws.
 */
export async function fetchPeerQuotes(
  req: PeerQuoteRequest,
  fiatAmount: number,
  destination: Record<string, unknown> | null,
  enabled = PEER_QUOTES_ENABLED_DEFAULT,
): Promise<{ quotes: NormalisedPeerQuote[]; diagnostics: PeerFetchDiagnostics }> {
  const startMs = Date.now();

  const baseDiag: Omit<PeerFetchDiagnostics, 'durationMs'> = {
    enabled,
    requestedPlatforms: req.paymentPlatforms,
    rawQuoteCount: 0,
    normalisedCount: 0,
    skippedCount: 0,
  };

  // ── Feature flag gate ────────────────────────────────────────────────────
  if (!enabled) {
    console.log('[PeerLP] Peer quote ingestion disabled (feature flag off)');
    return {
      quotes: [],
      diagnostics: { ...baseDiag, fallbackReason: 'feature_flag_disabled', durationMs: Date.now() - startMs },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PEER_QUOTE_TIMEOUT_MS);

  // ── Log request ──────────────────────────────────────────────────────────
  console.log('[PeerLP] Fetching quotes — EXPERIMENTAL, endpoint not verified', {
    endpoint: `${PEER_API_BASE}/quotes`,
    platforms: req.paymentPlatforms,
    fiatAmount: req.amount,
    fiatCurrency: req.fiatCurrency,
  });

  try {
    const res = await fetch(`${PEER_API_BASE}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    baseDiag.httpStatus = res.status;

    if (!res.ok) {
      const reason = `http_${res.status}`;
      console.warn(`[PeerLP] HTTP ${res.status} — endpoint may not exist or require auth. Skipping.`);
      return {
        quotes: [],
        diagnostics: { ...baseDiag, fallbackReason: reason, durationMs: Date.now() - startMs },
      };
    }

    // ── Parse + validate response shape ─────────────────────────────────
    let data: PeerQuoteResponse;
    try {
      data = await res.json() as PeerQuoteResponse;
    } catch {
      console.warn('[PeerLP] Response is not valid JSON — response shape does not match expected');
      return {
        quotes: [],
        diagnostics: { ...baseDiag, fallbackReason: 'invalid_json', durationMs: Date.now() - startMs },
      };
    }

    // Validate that the response at minimum has a quotes array
    if (!data || typeof data !== 'object') {
      console.warn('[PeerLP] Unexpected response shape — not an object');
      return {
        quotes: [],
        diagnostics: { ...baseDiag, fallbackReason: 'unexpected_shape', durationMs: Date.now() - startMs },
      };
    }

    const raw = [...(Array.isArray(data.quotes) ? data.quotes : []), ...(Array.isArray(data.nearbySuggestions) ? data.nearbySuggestions : [])];
    baseDiag.rawQuoteCount = raw.length;

    console.log(`[PeerLP] Received ${raw.length} raw quotes (${data.quotes?.length ?? 0} primary + ${data.nearbySuggestions?.length ?? 0} nearby)`);

    if (raw.length === 0) {
      return {
        quotes: [],
        diagnostics: { ...baseDiag, fallbackReason: 'no_quotes_returned', durationMs: Date.now() - startMs },
      };
    }

    // ── Normalise each raw quote ─────────────────────────────────────────
    const normalised: NormalisedPeerQuote[] = [];
    let skipped = 0;

    for (const q of raw) {
      const outputRaw = parseFloat(String(q.outputAmount ?? '0'));

      if (isNaN(outputRaw) || outputRaw <= 0) {
        console.warn('[PeerLP] Skipping quote — missing/invalid outputAmount', { quoteId: q.quoteId, outputAmount: q.outputAmount });
        skipped++;
        continue;
      }

      if (!q.paymentPlatform || typeof q.paymentPlatform !== 'string') {
        console.warn('[PeerLP] Skipping quote — missing paymentPlatform', { quoteId: q.quoteId });
        skipped++;
        continue;
      }

      // Decimal normalisation: USDC on-chain units (6 decimals) → human-readable
      // Heuristic: if value > 1000, treat as on-chain units; otherwise human-readable
      const outputUsdc = outputRaw > 1000 ? outputRaw / USDC_DECIMALS : outputRaw;
      const feeRaw = parseFloat(String(q.feeAmount ?? '0'));
      const feeUsdc = feeRaw > 1000 ? feeRaw / USDC_DECIMALS : feeRaw;
      const feeBps = fiatAmount > 0 ? Math.round((feeUsdc / fiatAmount) * 10000) : 0;
      const eta = typeof q.estimatedSettlementTime === 'number'
        ? q.estimatedSettlementTime
        : (PLATFORM_ETA_FALLBACK[q.paymentPlatform.toLowerCase()] ?? 120);

      normalised.push({
        id: `peer-${q.quoteId ?? q.depositId ?? Math.random().toString(36).slice(2, 9)}`,
        provider: q.paymentPlatform.toLowerCase(),
        outputAmount: outputUsdc.toFixed(6),
        feeAmount: feeUsdc.toFixed(6),
        feeBps,
        etaSeconds: eta,
        routeType: 'peer_lp',
        source: 'peer_lp',
        isBest: false,
        fiatCurrency: req.fiatCurrency,
        destination,
        depositor: typeof q.depositor === 'string' ? q.depositor : undefined,
      });
    }

    baseDiag.normalisedCount = normalised.length;
    baseDiag.skippedCount = skipped;

    console.log(`[PeerLP] Normalised ${normalised.length} quotes, skipped ${skipped}`, {
      providers: normalised.map(q => q.provider),
      outputAmounts: normalised.map(q => q.outputAmount),
    });

    if (normalised.length === 0) {
      return {
        quotes: [],
        diagnostics: { ...baseDiag, fallbackReason: 'all_quotes_failed_normalisation', durationMs: Date.now() - startMs },
      };
    }

    return { quotes: normalised, diagnostics: { ...baseDiag, durationMs: Date.now() - startMs } };

  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const reason = isTimeout ? 'timeout' : 'network_error';
    if (isTimeout) {
      console.warn(`[PeerLP] Timeout after ${PEER_QUOTE_TIMEOUT_MS}ms — skipping`);
    } else {
      console.warn('[PeerLP] Network error fetching quotes — skipping', err);
    }
    return {
      quotes: [],
      diagnostics: { ...baseDiag, fallbackReason: reason, durationMs: Date.now() - startMs },
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Build a PeerQuoteRequest from XRamp /quotes input.
 * Field names are INFERRED from protocol architecture — not verified against a live API.
 */
export function buildPeerQuoteRequest(params: {
  fiatAmount: string;
  fiatCurrency: string;
  paymentPlatforms: string[];
  destination?: Record<string, unknown> | null;
}): PeerQuoteRequest {
  const { fiatAmount, fiatCurrency, paymentPlatforms, destination } = params;

  const recipientAddress =
    (destination?.recipientAddress as string | undefined) ??
    '0x0000000000000000000000000000000000000000';

  // Peer V3 is deployed on Base mainnet; XRamp uses Avalanche Fuji for testing.
  // destinationChainId is passed through from the XRamp request if present.
  const chainId = (destination?.chainId as number | undefined) ?? 8453; // Base mainnet

  // USDC on Base mainnet (verified contract address)
  const destinationToken = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

  return {
    paymentPlatforms,
    fiatCurrency: fiatCurrency.toUpperCase(),
    user: '0x0000000000000000000000000000000000000000', // placeholder — no wallet required for quotes
    recipient: recipientAddress,
    destinationChainId: chainId,
    destinationToken,
    amount: fiatAmount,
    quotesToReturn: 5,
    isExactFiat: true,
    includeNearbyQuotes: true,
  };
}
