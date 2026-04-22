import { NextRequest, NextResponse } from 'next/server';
import { createToken, COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth';
import { authenticateAdminCredential } from '@/lib/admin-credentials';
import { logAuditEvent } from '@/lib/audit-log';
import { sanitizeString } from '@/lib/security';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.username !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }

  const username = sanitizeString(body.username, { collapseWhitespace: true, maxLength: 64 });
  const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';

  if (!username || !password) {
    return NextResponse.json(
      { success: false, message: 'Username and password are required' },
      { status: 400 }
    );
  }

  const result = await authenticateAdminCredential(username, password);
  if (!result.success) {
    const status = result.code === 'LOCKED' ? 429 : 401;
    const message =
      result.code === 'LOCKED'
        ? 'Too many failed login attempts. Try again later.'
        : 'Invalid credentials';
    const response = NextResponse.json({ success: false, message }, { status });

    if (result.retryAfterSeconds) {
      response.headers.set('Retry-After', String(result.retryAfterSeconds));
    }

    await logAuditEvent({
      request: req,
      action: 'login',
      entityType: 'auth',
      actorUsername: username,
      success: false,
      details: {
        code: result.code,
      },
    });

    return response;
  }

  const token = await createToken({ username: result.credential.username });

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, getAuthCookieOptions());

  await logAuditEvent({
    request: req,
    action: 'login',
    entityType: 'auth',
    actorUsername: result.credential.username,
    success: true,
  });

  return response;
}
