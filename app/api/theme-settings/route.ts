import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getThemeSettings, saveThemeSettings } from '@/lib/content/theme-settings';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { readSanitizedJsonObject } from '@/lib/security';

export async function GET(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const theme = await getThemeSettings({ createIfMissing: true });
    return NextResponse.json(theme);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch theme settings' }, { status: 500 });
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

    const theme = await saveThemeSettings(body);

    revalidatePath('/');
    revalidatePath('/', 'layout');
    revalidatePath('/admin/theme');

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'theme_settings',
      entityId: theme?._id ? String(theme._id) : '',
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    return NextResponse.json(theme);
  } catch {
    return NextResponse.json({ error: 'Failed to update theme settings' }, { status: 500 });
  }
}
