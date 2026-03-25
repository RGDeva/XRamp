// ─── Partner Liquidity Source ─────────────────────────────────────────────────
//
// Config-driven adapter for partner / market-maker LPs.
//
// Each partner entry specifies which payment rails they support, their fee and
// ETA per rail, and min/max fiat size limits. Quotes are normalised into the
// same shape as XRamp LP quotes and ranked together in POST /quotes.
//
// To onboard a new partner: add an entry to PARTNER_CATALOGUE below.
// To disable a partner without deleting config: set enabled: false.
//
// Source tag: 'partner_lp'
// ─────────────────────────────────────────────────────────────────────────────

// ─── Config types ─────────────────────────────────────────────────────────────

/** Per-rail configuration for a partner LP. */
export interface PartnerRailConfig {
  /** Payment rail identifier, e.g. 'revolut', 'venmo', 'wise' */
  rail: string;
  /** Fee in basis points, e.g. 35 = 0.35% */
  feeBps: number;
  /** Estimated settlement time in seconds */
  etaSeconds: number;
  /** Minimum fiat amount (USD) this partner accepts on this rail */
  minFiatAmount: number;
  /** Maximum fiat amount (USD) this partner accepts on this rail */
  maxFiatAmount: number;
}

/** Capital / escrow funding metadata for a partner LP. */
export interface PartnerCapitalConfig {
  /**
   * Name of the Cloudflare Worker env var that holds the partner's on-chain
   * funding wallet address (checksummed EVM address string).
   * Resolved at runtime via env[fundingWalletAddressEnvVar].
   * Required — no silent fallback to XRamp arbiter.
   */
  fundingWalletAddressEnvVar: string;
  /**
   * Name of the Cloudflare Worker env var that holds the partner's private key.
   * If set AND the env var is present at runtime → partner wallet signs escrow (Mode A).
   * If NOT set (or env var missing) → intent must be funded via /report-funding
   *   (partner self-funds by signing on their side and reporting the tx, Mode B).
   * XRamp arbiter NEVER silently substitutes for a missing partner key.
   */
  partnerPrivateKeyEnvVar?: string;
  /**
   * Optional per-partner escrow contract override.
   * Defaults to env.ESCROW_CONTRACT_ADDRESS if not set.
   */
  escrowContractAddress?: string;
}

/** Full config entry for a partner LP. */
export interface PartnerLPConfig {
  /** Unique identifier, used in quote IDs and analytics */
  id: string;
  /** Display name shown in the UI */
  name: string;
  /** Whether this partner is currently active */
  enabled: boolean;
  /** Per-rail configs — partner may support multiple rails */
  rails: PartnerRailConfig[];
  /** Optional settlement handle metadata (for routing payment to partner) */
  settlementHandles?: Partial<Record<string, string>>;
  /**
   * Capital / escrow funding metadata.
   * Required for all partner_lp intents — worker hard-errors (422) if absent.
   * Not optional in practice; typed optional only for catalogue entries in transition.
   */
  capital: PartnerCapitalConfig;
}

// ─── Partner catalogue ────────────────────────────────────────────────────────
//
// Add new entries here to onboard a partner LP.
// Fees are expressed in basis points (100 bps = 1%).
//
export const PARTNER_CATALOGUE: PartnerLPConfig[] = [
  {
    id: 'alpha_lp',
    name: 'Alpha Markets',
    enabled: true,
    rails: [
      { rail: 'revolut', feeBps: 35, etaSeconds: 75,  minFiatAmount: 10,  maxFiatAmount: 5000 },
      { rail: 'wise',    feeBps: 60, etaSeconds: 150, minFiatAmount: 25,  maxFiatAmount: 10000 },
    ],
    settlementHandles: {
      revolut: '@alphamarkets',
      wise:    'payments@alphamarkets.xyz',
    },
    capital: {
      // Env var holding the checksummed EVM address of Alpha Markets' Fuji funding wallet.
      // TODO: set ALPHA_LP_FUNDING_ADDRESS in wrangler secrets with real address before production.
      fundingWalletAddressEnvVar: 'ALPHA_LP_FUNDING_ADDRESS',
      // Env var holding Alpha Markets' private key (Mode A). If absent → Mode B (self-fund).
      // TODO: set ALPHA_LP_PRIVATE_KEY in wrangler secrets before production.
      partnerPrivateKeyEnvVar: 'ALPHA_LP_PRIVATE_KEY',
    },
  },
  {
    id: 'beta_lp',
    name: 'Beta Liquidity',
    enabled: true,
    rails: [
      { rail: 'venmo',   feeBps: 45, etaSeconds: 100, minFiatAmount: 5,   maxFiatAmount: 2000 },
      { rail: 'revolut', feeBps: 38, etaSeconds: 80,  minFiatAmount: 20,  maxFiatAmount: 3000 },
    ],
    settlementHandles: {
      venmo:   '@betaliquidity',
      revolut: '@betaliquidity',
    },
    capital: {
      // Env var holding the checksummed EVM address of Beta Liquidity's Fuji funding wallet.
      // TODO: set BETA_LP_FUNDING_ADDRESS in wrangler secrets with real address before production.
      fundingWalletAddressEnvVar: 'BETA_LP_FUNDING_ADDRESS',
      // partnerPrivateKeyEnvVar intentionally absent — Beta Liquidity self-funds via /report-funding.
    },
  },
];

// ─── Normalised quote type ────────────────────────────────────────────────────

/** XRamp-normalised partner LP quote, ready for ranking. */
export interface NormalisedPartnerQuote {
  id: string;
  provider: string;
  outputAmount: string;
  feeAmount: string;
  feeBps: number;
  etaSeconds: number;
  routeType: 'partner_lp';
  source: 'partner_lp';
  isBest: boolean;
  fiatCurrency: string;
  destination: Record<string, unknown> | null;
  /** Partner identifier for attribution and analytics */
  partnerId: string;
  /** Partner display name */
  partnerName: string;
  /** Settlement handle for this rail, if configured */
  settlementHandle?: string;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * Generate normalised partner LP quotes for the given fiat amount and providers.
 *
 * Safeguards applied per quote:
 *   - partner.enabled must be true
 *   - rail must be in enabledProviders
 *   - fiatAmount must be within [minFiatAmount, maxFiatAmount]
 *   - malformed config entries are skipped with a warning
 *
 * Always synchronous — no network calls, no risk of timeout or failure.
 */
export function getPartnerQuotes(params: {
  fiatAmount: number;
  fiatCurrency: string;
  enabledProviders: string[];
  destination?: Record<string, unknown> | null;
  catalogue?: PartnerLPConfig[];
}): NormalisedPartnerQuote[] {
  const {
    fiatAmount,
    fiatCurrency,
    enabledProviders,
    destination = null,
    catalogue = PARTNER_CATALOGUE,
  } = params;

  const quotes: NormalisedPartnerQuote[] = [];

  for (const partner of catalogue) {
    // ── Safeguard: skip disabled partners ────────────────────────────────
    if (!partner.enabled) continue;

    // ── Validate config shape ────────────────────────────────────────────
    if (!partner.id || !partner.name || !Array.isArray(partner.rails)) {
      console.warn('[PartnerLP] Malformed partner config — skipping', partner);
      continue;
    }

    for (const rail of partner.rails) {
      // ── Safeguard: skip unsupported rails ────────────────────────────
      if (!enabledProviders.includes(rail.rail)) continue;

      // ── Safeguard: validate rail config shape ────────────────────────
      if (
        typeof rail.feeBps !== 'number' ||
        typeof rail.etaSeconds !== 'number' ||
        typeof rail.minFiatAmount !== 'number' ||
        typeof rail.maxFiatAmount !== 'number'
      ) {
        console.warn(`[PartnerLP] Malformed rail config for ${partner.id}/${rail.rail} — skipping`, rail);
        continue;
      }

      // ── Safeguard: min/max size limits ───────────────────────────────
      if (fiatAmount < rail.minFiatAmount) {
        console.log(`[PartnerLP] ${partner.id}/${rail.rail}: amount ${fiatAmount} below min ${rail.minFiatAmount} — skipping`);
        continue;
      }
      if (fiatAmount > rail.maxFiatAmount) {
        console.log(`[PartnerLP] ${partner.id}/${rail.rail}: amount ${fiatAmount} above max ${rail.maxFiatAmount} — skipping`);
        continue;
      }

      const feeAmount = fiatAmount * (rail.feeBps / 10000);
      const outputAmount = fiatAmount - feeAmount;
      const settlementHandle = partner.settlementHandles?.[rail.rail];

      quotes.push({
        id: `${partner.id}-${rail.rail}-${Date.now()}`,
        provider: rail.rail,
        outputAmount: outputAmount.toFixed(6),
        feeAmount: feeAmount.toFixed(6),
        feeBps: rail.feeBps,
        etaSeconds: rail.etaSeconds,
        routeType: 'partner_lp',
        source: 'partner_lp',
        isBest: false,
        fiatCurrency,
        destination: destination ?? null,
        partnerId: partner.id,
        partnerName: partner.name,
        ...(settlementHandle ? { settlementHandle } : {}),
      });
    }
  }

  console.log(`[PartnerLP] Generated ${quotes.length} partner quotes for $${fiatAmount} ${fiatCurrency}`, {
    partners: [...new Set(quotes.map(q => q.partnerId))],
    providers: quotes.map(q => q.provider),
  });

  return quotes;
}
