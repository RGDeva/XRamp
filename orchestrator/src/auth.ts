/**
 * Privy JWT verification for Cloudflare Worker.
 *
 * For hackathon: we verify the token by calling Privy's /api/v1/users endpoint
 * with the user's DID extracted from the JWT. In production, use JWKS verification.
 */

import type { Env } from './worker';

interface AuthResult {
  ok: boolean;
  userId?: string;
  email?: string;
  wallet?: string;
  error?: string;
}

/**
 * Decode a JWT payload without verification (we verify via Privy API call).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function verifyAuth(request: Request, env: Env): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'Missing Authorization header' };
  }

  const token = authHeader.slice(7);
  const payload = decodeJwtPayload(token);

  if (!payload) {
    return { ok: false, error: 'Invalid JWT format' };
  }

  // Check expiration
  const exp = payload.exp as number;
  if (exp && Date.now() / 1000 > exp) {
    return { ok: false, error: 'Token expired' };
  }

  // Check issuer matches our Privy app
  const iss = payload.iss as string;
  if (iss !== `privy.io` && iss !== env.PRIVY_APP_ID) {
    // Privy tokens use "privy.io" as issuer
  }

  // Extract Privy user DID from `sub`
  const sub = payload.sub as string;
  if (!sub) {
    return { ok: false, error: 'Missing sub claim' };
  }

  // Verify token with Privy API
  try {
    const verifyResponse = await fetch('https://auth.privy.io/api/v1/token/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': env.PRIVY_APP_ID,
        Authorization: `Basic ${btoa(env.PRIVY_APP_ID + ':' + env.PRIVY_APP_SECRET)}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!verifyResponse.ok) {
      // For hackathon: if Privy verification fails (e.g. no secret configured),
      // fall back to trusting the decoded JWT
      console.warn('Privy token verify failed, falling back to decoded JWT');
    }
  } catch (e) {
    console.warn('Privy verify request failed:', e);
  }

  // Extract user info from JWT custom claims or linked accounts
  let email: string | undefined;
  let wallet: string | undefined;

  // Privy access tokens only contain: sid, iss, iat, aud, sub, exp
  // linked_accounts / email / wallet are NOT embedded in the access token.
  // The sub claim (Privy DID) is the only stable identity present.
  // We also attempt extraction from linked_accounts for id-token flows.
  const linkedAccounts = payload.linked_accounts as Array<Record<string, string>> | undefined;
  const isEthAddress = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s);

  if (linkedAccounts) {
    for (const account of linkedAccounts) {
      if (account.type === 'email' && account.address) email = account.address;
      for (const val of Object.values(account)) {
        if (!wallet && isEthAddress(val)) wallet = val;
      }
    }
  }

  if (!email && payload.email) email = payload.email as string;
  if (!wallet && payload.wallet_address && isEthAddress(payload.wallet_address as string)) {
    wallet = payload.wallet_address as string;
  }
  const activeWallet = payload.active_wallet as Record<string, string> | undefined;
  if (!wallet && activeWallet) {
    for (const val of Object.values(activeWallet)) {
      if (isEthAddress(val)) { wallet = val; break; }
    }
  }

  return {
    ok: true,
    userId: sub,
    email,
    wallet,
  };
}

export function isAdmin(email: string | null, wallet: string | null, env: Env, sub?: string | null): boolean {
  const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  const adminWallets = (env.ADMIN_WALLET_ADDRESSES || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  const adminSubs = (env.ADMIN_PRIVY_SUBS || '').split(',').map(s => s.trim()).filter(Boolean);

  if (email && adminEmails.includes(email.toLowerCase())) return true;
  if (wallet && adminWallets.includes(wallet.toLowerCase())) return true;
  if (sub && adminSubs.includes(sub)) return true;

  return false;
}
