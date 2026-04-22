import { NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export type AuthContext = {
  username: string;
};

function getCookieValue(req: Request) {
  // @ts-expect-error - NextRequest extends Request and adds .cookies; header fallback still supports plain Request.
  return req.cookies?.get?.(COOKIE_NAME)?.value ??
    req.headers.get('cookie')
      ?.split(';')
      .find((cookie) => cookie.trim().startsWith(`${COOKIE_NAME}=`))
      ?.split('=')
      .slice(1)
      .join('=')
      .trim() ??
    '';
}

export async function getAuthContext(req: Request): Promise<AuthContext | null> {
  const token = getCookieValue(req);
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload?.username) {
    return null;
  }

  return { username: payload.username };
}

/**
 * Returns a 401 response if the request is not authenticated,
 * or null if authentication passed. Accepts both Request and NextRequest.
 */
export async function requireAuth(req: Request): Promise<NextResponse | null> {
  const authContext = await getAuthContext(req);
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
