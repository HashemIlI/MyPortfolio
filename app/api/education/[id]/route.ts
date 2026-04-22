import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Education from '@/models/Education';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { readSanitizedJsonObject } from '@/lib/security';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const education = await Education.findById(id).lean();
    if (!education) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(education)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch education' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const authContext = await getAuthContext(request);
    await connectDB();
    const body = await readSanitizedJsonObject<Record<string, unknown>>(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const education = await Education.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!education) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'education',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { degreeEn: education.degreeEn, institutionEn: education.institutionEn },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(education)));
  } catch {
    return NextResponse.json({ error: 'Failed to update education' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const authContext = await getAuthContext(request);
    await connectDB();
    await Education.findByIdAndDelete(id);

    await logAuditEvent({
      request,
      action: 'delete',
      entityType: 'education',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete education' }, { status: 500 });
  }
}
