// ─── XRamp SDK ───────────────────────────────────────────────────────────────
// Minimal integration layer for controlling the XRamp extension from any web app.
// Uses window.postMessage to communicate with the XRamp content script.
//
// Usage:
//   const sdk = createXRampSdk({ window });
//   const state = await sdk.getState();           // 'ready' | 'needs_install'
//   sdk.onIntentFulfilled((data) => { ... });     // listen for completion
//   sdk.onramp({ amount: '50', provider: 'wise', destination: { chainId: 43113, token: 'USDC', recipientAddress: '0x...' } });

export type XRampState = 'ready' | 'needs_install';

export interface OnrampDestination {
  chainId: number;
  token: string;
  recipientAddress: string;
  app?: string;   // e.g. 'lfj' — triggers post-completion CTA
  memo?: string;
}

export interface OnrampConfig {
  amount: string;
  provider: string;
  destination: OnrampDestination;
  asset?: string;
  quoteId?: string;
}

export interface IntentFulfilledData {
  intentId: string;
  rail: string;
  amount: string;
  state: string;
  destination?: OnrampDestination;
  proofHash?: string;
  txHash?: string;
}

export interface XRampSdk {
  /** Detect whether the XRamp extension is installed and responding. */
  getState: () => Promise<XRampState>;

  /** Open the XRamp onramp flow with the given config. */
  onramp: (config: OnrampConfig) => void;

  /** The destination.app from the last fulfilled intent (e.g. 'lfj'). */
  readonly lastApp: string | null;

  /** Register a callback for when the extension completes an intent. Returns an unsubscribe function. */
  onIntentFulfilled: (cb: (data: IntentFulfilledData) => void) => () => void;

  /** Tear down all listeners. */
  destroy: () => void;
}

export function createXRampSdk(opts: { window: Window }): XRampSdk {
  const win = opts.window;
  const listeners: Set<(data: IntentFulfilledData) => void> = new Set();
  let _lastApp: string | null = null;

  // ── Internal listener for extension → web app messages ────────────────────
  function handleMessage(event: MessageEvent) {
    if (event.source !== win) return;

    // Intent completion relay
    if (event.data?.type === 'XRAMP_INTENT_COMPLETE' && event.data.payload) {
      const payload = event.data.payload as IntentFulfilledData;
      _lastApp = payload.destination?.app ?? null;
      listeners.forEach(cb => {
        try { cb(payload); } catch { /* swallow consumer errors */ }
      });
    }
  }

  win.addEventListener('message', handleMessage);

  return {
    async getState(): Promise<XRampState> {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          win.removeEventListener('message', onPong);
          resolve('needs_install');
        }, 1500);

        function onPong(event: MessageEvent) {
          if (event.source !== win) return;
          if (event.data?.type === 'XRAMP_PONG') {
            clearTimeout(timeout);
            win.removeEventListener('message', onPong);
            resolve('ready');
          }
        }

        win.addEventListener('message', onPong);
        win.postMessage({ type: 'XRAMP_PING' }, '*');
      });
    },

    onramp(config: OnrampConfig) {
      win.postMessage({
        type: 'XRAMP_OPEN_ONRAMP',
        payload: {
          amount: config.amount,
          provider: config.provider,
          destination: config.destination,
          asset: config.asset || 'USDC',
          quoteId: config.quoteId,
        },
      }, '*');
    },

    /** Returns the last fulfilled intent's destination.app if present (for post-completion CTA). */
    get lastApp() {
      return _lastApp;
    },

    onIntentFulfilled(cb: (data: IntentFulfilledData) => void) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },

    destroy() {
      win.removeEventListener('message', handleMessage);
      listeners.clear();
    },
  };
}
