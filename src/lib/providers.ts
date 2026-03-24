// ─── XRamp Provider Registry ──────────────────────────────────────────────────
// Single source of truth for all payment rails: LP handles, handle metadata,
// and proof engine type. Import from here — never hardcode rail details inline.

export type ProofEngine = 'venmo' | 'wise' | 'revolut' | 'manual';

export type RampProviderId =
  | 'venmo'
  | 'wise'
  | 'revolut'
  | 'cashapp'
  | 'paypal'
  | 'zelle'
  | 'chime';

export interface RampProvider {
  id: RampProviderId;
  label: string;
  lpHandle: string;
  handleMeta: {
    label: string;
    placeholder: string;
    prefix?: string;
  };
  proofEngine: ProofEngine;
  live: boolean;
}

export const PROVIDERS: Record<RampProviderId, RampProvider> = {
  venmo: {
    id: 'venmo',
    label: 'Venmo',
    lpHandle: '@primeaj',
    handleMeta: {
      label: 'Venmo username',
      placeholder: 'yourname',
      prefix: '@',
    },
    proofEngine: 'venmo',
    live: true,
  },
  wise: {
    id: 'wise',
    label: 'Wise',
    lpHandle: 'primeaj@xramp.xyz',
    handleMeta: {
      label: 'Wise email',
      placeholder: 'you@email.com',
    },
    proofEngine: 'wise',
    live: true,
  },
  revolut: {
    id: 'revolut',
    label: 'Revolut',
    lpHandle: '@primeaj',
    handleMeta: {
      label: 'Revolut tag',
      placeholder: 'yourrevtag',
      prefix: '@',
    },
    proofEngine: 'revolut',
    live: false,
  },
  cashapp: {
    id: 'cashapp',
    label: 'Cash App',
    lpHandle: '$primeaj',
    handleMeta: {
      label: 'Cash Tag',
      placeholder: 'yourcashtag',
      prefix: '$',
    },
    proofEngine: 'manual',
    live: true,
  },
  paypal: {
    id: 'paypal',
    label: 'PayPal',
    lpHandle: 'primeaj@xramp.xyz',
    handleMeta: {
      label: 'PayPal email / @handle',
      placeholder: 'you@email.com',
    },
    proofEngine: 'manual',
    live: true,
  },
  zelle: {
    id: 'zelle',
    label: 'Zelle',
    lpHandle: 'primeaj@xramp.xyz',
    handleMeta: {
      label: 'Zelle email / phone',
      placeholder: 'email or phone',
    },
    proofEngine: 'manual',
    live: true,
  },
  chime: {
    id: 'chime',
    label: 'Chime',
    lpHandle: '@primeaj',
    handleMeta: {
      label: 'ChimeSign',
      placeholder: 'yourname',
      prefix: '@',
    },
    proofEngine: 'manual',
    live: true,
  },
};

/** Look up a provider by rail id. Falls back to a safe default if unknown. */
export function getProvider(id: string): RampProvider {
  return PROVIDERS[id as RampProviderId] ?? PROVIDERS.venmo;
}
