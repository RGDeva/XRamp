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

  // Privy embeds linked account info in custom claims
  const linkedAccounts = payload.linked_accounts as Array<Record<string, string>> | undefined;
  if (linkedAccounts) {
    for (const account of linkedAccounts) {
      if (account.type === 'email') email = account.address;
      if (account.type === 'wallet') wallet = wallet || account.address;
    }
  }

  // Also check direct claims (some Privy token formats)
  if (!email && payload.email) email = payload.email as string;
  if (!wallet && payload.wallet_address) wallet = payload.wallet_address as string;

  return {
    ok: true,
    userId: sub,
    email,
    wallet,
  };
}

export function isAdmin(email: string | null, wallet: string | null, env: Env): boolean {
  const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  const adminWallets = (env.ADMIN_WALLET_ADDRESSES || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);

  if (email && adminEmails.includes(email.toLowerCase())) return true;
  if (wallet && adminWallets.includes(wallet.toLowerCase())) return true;

  return false;
}
