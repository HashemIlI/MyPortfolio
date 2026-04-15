import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';
import {
  getAdminCredentialSummary,
  updateAdminCredential,
} from '@/lib/admin-credentials';

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
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const username = typeof body.username === 'string' ? body.username : '';
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

    return NextResponse.json(credential);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update credentials' },
      { status: 400 }
    );
  }
}
