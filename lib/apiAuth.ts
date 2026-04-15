import { NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

/**
 * Returns a 401 response if the request is not authenticated,
 * or null if authentication passed. Accepts both Request and NextRequest.
 */
export async function requireAuth(req: Request): Promise<NextResponse | null> {
  // @ts-expect-error – NextRequest extends Request and adds .cookies; access via header fallback for plain Request
  const cookieHeader = req.cookies?.get?.(COOKIE_NAME)?.value ??
    req.headers.get('cookie')
      ?.split(';')
      .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
      ?.split('=')
      .slice(1)
      .join('=')
      .trim();

  if (!cookieHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(cookieHeader);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
