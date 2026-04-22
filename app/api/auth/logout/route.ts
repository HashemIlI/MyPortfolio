import { NextResponse } from 'next/server';
import { COOKIE_NAME, getExpiredAuthCookieOptions } from '@/lib/auth';
import { getAuthContext } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';

export async function POST(request: Request) {
  const authContext = await getAuthContext(request);
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, '', getExpiredAuthCookieOptions());

  await logAuditEvent({
    request,
    action: 'logout',
    entityType: 'auth',
    actorUsername: authContext?.username ?? '',
    success: true,
  });

  return response;
}
