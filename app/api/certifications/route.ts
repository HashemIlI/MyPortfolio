import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Certification from '@/models/Certification';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { readSanitizedJsonObject } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminMode = searchParams.get('admin') === 'true';
    if (adminMode) {
      const authError = await requireAuth(request);
      if (authError) return authError;
    }

    await connectDB();
    const query = adminMode ? {} : { visible: true };
    const certs = await Certification.find(query).sort({ order: 1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(certs)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
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
    const cert = await Certification.create(body);

    await logAuditEvent({
      request,
      action: 'create',
      entityType: 'certification',
      entityId: String(cert._id),
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { nameEn: cert.nameEn, issuer: cert.issuer },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(cert.toObject())), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create certification' }, { status: 500 });
  }
}
