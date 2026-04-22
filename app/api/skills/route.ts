import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';
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
    const skills = await Skill.find(query).sort({ category: 1, order: 1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(skills)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
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
    const skill = await Skill.create(body);

    await logAuditEvent({
      request,
      action: 'create',
      entityType: 'skill',
      entityId: String(skill._id),
      actorUsername: authContext?.username ?? '',
      success: true,
      details: {
        nameEn: skill.nameEn,
        category: skill.category,
      },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(skill.toObject())), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
