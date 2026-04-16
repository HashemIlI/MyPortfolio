import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Certification from '@/models/Certification';
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
    const cert = await Certification.findById(id).lean();
    if (!cert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(cert)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch certification' }, { status: 500 });
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
    const cert = await Certification.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!cert) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'certification',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { nameEn: cert.nameEn, issuer: cert.issuer },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(cert)));
  } catch {
    return NextResponse.json({ error: 'Failed to update certification' }, { status: 500 });
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
    await Certification.findByIdAndDelete(id);

    await logAuditEvent({
      request,
      action: 'delete',
      entityType: 'certification',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete certification' }, { status: 500 });
  }
}
