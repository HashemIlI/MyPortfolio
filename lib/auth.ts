import { SignJWT, jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/env';

export const COOKIE_NAME = 'portfolio_admin_token';

const getSecret = () =>
  new TextEncoder().encode(getJwtSecret());

export async function createToken(payload: { username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { username: string };
  } catch {
    return null;
  }
}
