import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Experience from '@/models/Experience';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { readSanitizedJsonObject, sanitizeStringArray } from '@/lib/security';

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
    const experience = await Experience.find(query).sort({ order: 1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(experience)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch experience' }, { status: 500 });
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
    if ('bulletsEn' in body) body.bulletsEn = sanitizeStringArray(body.bulletsEn);
    if ('bulletsAr' in body) body.bulletsAr = sanitizeStringArray(body.bulletsAr);
    if ('tools' in body) body.tools = sanitizeStringArray(body.tools);
    if ('metaKeywords' in body) body.metaKeywords = sanitizeStringArray(body.metaKeywords);
    const exp = await Experience.create(body);

    await logAuditEvent({
      request,
      action: 'create',
      entityType: 'experience',
      entityId: String(exp._id),
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { titleEn: exp.titleEn, companyEn: exp.companyEn },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(exp.toObject())), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create experience' }, { status: 500 });
  }
}
