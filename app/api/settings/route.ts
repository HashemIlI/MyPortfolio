import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { readSanitizedJsonObject, sanitizeStringArray } from '@/lib/security';

export async function GET(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();
    const existingSettings = await SiteSettings.findOne().lean();
    const settings = existingSettings ?? (await SiteSettings.create({})).toObject();
    return NextResponse.json(JSON.parse(JSON.stringify(settings)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const authContext = await getAuthContext(request);
    await connectDB();
    const body = await readSanitizedJsonObject<Record<string, unknown>>(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    if ('siteKeywords' in body) {
      body.siteKeywords = sanitizeStringArray(body.siteKeywords);
    }
    const settings = await SiteSettings.findOneAndUpdate({}, body, {
      upsert: true,
      new: true,
      runValidators: true,
    }).lean();
    revalidatePath('/');
    revalidatePath('/', 'layout');
    revalidatePath('/admin/settings');

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'site_settings',
      entityId: settings?._id ? String(settings._id) : '',
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    return NextResponse.json(JSON.parse(JSON.stringify(settings)));
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
