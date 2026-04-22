import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Experience from '@/models/Experience';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { readSanitizedJsonObject, sanitizeStringArray } from '@/lib/security';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const exp = await Experience.findById(id).lean();
    if (!exp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(exp)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch experience' }, { status: 500 });
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
    if ('bulletsEn' in body) body.bulletsEn = sanitizeStringArray(body.bulletsEn);
    if ('bulletsAr' in body) body.bulletsAr = sanitizeStringArray(body.bulletsAr);
    if ('tools' in body) body.tools = sanitizeStringArray(body.tools);
    if ('metaKeywords' in body) body.metaKeywords = sanitizeStringArray(body.metaKeywords);
    const exp = await Experience.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!exp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'experience',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { titleEn: exp.titleEn, companyEn: exp.companyEn },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(exp)));
  } catch {
    return NextResponse.json({ error: 'Failed to update experience' }, { status: 500 });
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
    await Experience.findByIdAndDelete(id);

    await logAuditEvent({
      request,
      action: 'delete',
      entityType: 'experience',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete experience' }, { status: 500 });
  }
}
