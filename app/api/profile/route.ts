import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getProfile, saveProfile } from '@/lib/content/profile';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { readSanitizedJsonObject } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const profile = await getProfile({ createIfMissing: true });
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const authContext = await getAuthContext(request);
    const body = await readSanitizedJsonObject<Record<string, unknown>>(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const profile = await saveProfile(body);

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'profile',
      entityId: profile?._id ? String(profile._id) : '',
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    revalidatePath('/', 'page');

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
