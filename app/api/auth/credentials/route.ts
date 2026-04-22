import { NextResponse } from 'next/server';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import {
  getAdminCredentialSummary,
  updateAdminCredential,
} from '@/lib/admin-credentials';
import { logAuditEvent } from '@/lib/audit-log';
import { sanitizeString } from '@/lib/security';

export async function GET(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const credential = await getAdminCredentialSummary();
    return NextResponse.json(credential);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const authContext = await getAuthContext(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const username = typeof body.username === 'string'
      ? sanitizeString(body.username, { collapseWhitespace: true, maxLength: 64 })
      : '';
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!username || !currentPassword) {
      return NextResponse.json(
        { error: 'Username and current password are required' },
        { status: 400 }
      );
    }

    const credential = await updateAdminCredential({
      username,
      currentPassword,
      newPassword,
    });

    await logAuditEvent({
      request,
      action: credential.passwordChanged ? 'password_change' : 'credential_update',
      entityType: 'auth',
      actorUsername: authContext?.username ?? credential.username,
      success: true,
      details: {
        username: credential.username,
      },
    });

    return NextResponse.json(credential);
  } catch (error) {
    const authContext = await getAuthContext(request);
    await logAuditEvent({
      request,
      action: 'credential_update',
      entityType: 'auth',
      actorUsername: authContext?.username ?? '',
      success: false,
      details: {
        message: error instanceof Error ? error.message : 'Failed to update credentials',
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update credentials' },
      { status: 400 }
    );
  }
}
