import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';
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
    const skill = await Skill.findById(id).lean();
    if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(skill)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 });
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
    const skill = await Skill.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'skill',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
      details: {
        nameEn: skill.nameEn,
        category: skill.category,
      },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(skill)));
  } catch {
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
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
    await Skill.findByIdAndDelete(id);

    await logAuditEvent({
      request,
      action: 'delete',
      entityType: 'skill',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
