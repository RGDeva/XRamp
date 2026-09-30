/**
 * Privy JWT verification for Cloudflare Worker.
 *
 * Access tokens are verified cryptographically against Privy's published
 * JWKS (ES256), with issuer and audience checks. Any failure rejects the
 * request — there is no fallback to trusting a decoded token.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Env } from './worker';

interface AuthResult {
  ok: boolean;
  userId?: string;
  email?: string;
  wallet?: string;
  error?: string;
}

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedAppId: string | null = null;

function getJwks(appId: string) {
  if (!cachedJwks || cachedAppId !== appId) {
    cachedJwks = createRemoteJWKSet(
      new URL(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`),
    );
    cachedAppId = appId;
  }
  return cachedJwks;
}

export async function verifyAuth(request: Request, env: Env): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'Missing Authorization header' };
  }
  if (!env.PRIVY_APP_ID) {
    return { ok: false, error: 'Auth not configured' };
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, getJwks(env.PRIVY_APP_ID), {
      issuer: 'privy.io',
      audience: env.PRIVY_APP_ID,
    });

    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    if (!sub) return { ok: false, error: 'Unauthorized' };

    // Privy access tokens only carry the user DID (sub). Email / wallet are
    // not present and are never trusted for authorization decisions.
    return { ok: true, userId: sub };
  } catch {
    return { ok: false, error: 'Unauthorized' };
  }
}

/**
 * Admin check is based solely on the cryptographically verified Privy DID.
 * Email and wallet claims are ignored because they are not verified here.
 */
export function isAdmin(
  _email: string | null,
  _wallet: string | null,
  env: Env,
  sub?: string | null,
): boolean {
  const adminSubs = (env.ADMIN_PRIVY_SUBS || '').split(',').map(s => s.trim()).filter(Boolean);
  return !!sub && adminSubs.includes(sub);
}
