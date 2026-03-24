// ─── XRamp SDK ───────────────────────────────────────────────────────────────
// Minimal integration layer for controlling the XRamp extension from any web app.
// Uses window.postMessage to communicate with the XRamp content script.
//
// Usage:
//   const sdk = createXRampSdk({ window });
//   const state = await sdk.getState();           // 'ready' | 'needs_install'
//   sdk.onIntentFulfilled((data) => { ... });     // listen for completion
//   sdk.onramp({ amount: '50', provider: 'wise', destination: '0x...' });

export type XRampState = 'ready' | 'needs_install';

export interface OnrampConfig {
  amount: string;
  provider: string;
  destination: string;
  asset?: string;
}

export interface IntentFulfilledData {
  intentId: string;
  rail: string;
  amount: string;
  state: string;
  proofHash?: string;
  txHash?: string;
}

export interface XRampSdk {
  /** Detect whether the XRamp extension is installed and responding. */
  getState: () => Promise<XRampState>;

  /** Open the XRamp onramp flow with the given config. */
  onramp: (config: OnrampConfig) => void;

  /** Register a callback for when the extension completes an intent. Returns an unsubscribe function. */
  onIntentFulfilled: (cb: (data: IntentFulfilledData) => void) => () => void;

  /** Tear down all listeners. */
  destroy: () => void;
}

export function createXRampSdk(opts: { window: Window }): XRampSdk {
  const win = opts.window;
  const listeners: Set<(data: IntentFulfilledData) => void> = new Set();

  // ── Internal listener for extension → web app messages ────────────────────
  function handleMessage(event: MessageEvent) {
    if (event.source !== win) return;

    // Intent completion relay
    if (event.data?.type === 'XRAMP_INTENT_COMPLETE' && event.data.payload) {
      const payload = event.data.payload as IntentFulfilledData;
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
        },
      }, '*');
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
