import { SignJWT, jwtVerify } from 'jose';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { getJwtSecret } from '@/lib/env';

export const COOKIE_NAME = 'portfolio_admin_token';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const getSecret = () =>
  new TextEncoder().encode(getJwtSecret());

export type AuthTokenPayload = {
  username: string;
};

export function getAuthCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    priority: 'high',
  };
}

export function getExpiredAuthCookieOptions(): Partial<ResponseCookie> {
  return {
    ...getAuthCookieOptions(),
    maxAge: 0,
  };
}

export async function createToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}
