import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Education from '@/models/Education';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { readSanitizedJsonObject } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    if (isAdmin) {
      const authError = await requireAuth(request);
      if (authError) return authError;
    }
    await connectDB();
    const filter = isAdmin ? {} : { visible: true };
    const education = await Education.find(filter).sort({ order: 1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(education)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch education' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const authContext = await getAuthContext(request);
    await connectDB();
    const body = await readSanitizedJsonObject<Record<string, unknown>>(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const education = await Education.create(body);

    await logAuditEvent({
      request,
      action: 'create',
      entityType: 'education',
      entityId: String(education._id),
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { degreeEn: education.degreeEn, institutionEn: education.institutionEn },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(education.toObject())), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create education' }, { status: 500 });
  }
}
