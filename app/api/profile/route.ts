import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { readSanitizedJsonObject } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    await connectDB();
    const existingProfile = await Profile.findOne().lean();
    const profile = existingProfile ?? (await Profile.create({})).toObject();
    return NextResponse.json(JSON.parse(JSON.stringify(profile)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
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
    const profile = await Profile.findOneAndUpdate({}, body, {
      upsert: true,
      new: true,
      runValidators: true,
    }).lean();

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'profile',
      entityId: profile?._id ? String(profile._id) : '',
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    return NextResponse.json(JSON.parse(JSON.stringify(profile)));
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
