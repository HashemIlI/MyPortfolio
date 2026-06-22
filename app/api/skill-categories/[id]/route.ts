import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import SkillCategory from '@/models/SkillCategory';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { getApiErrorDetails } from '@/lib/api-error';
import { readSanitizedJsonObject } from '@/lib/security';
import { slugify } from '@/lib/utils';

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
      return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
    }

    const nameEn = String(body.nameEn || '').trim();
    if (!nameEn) {
      return NextResponse.json({ success: false, message: 'Category name is required.' }, { status: 400 });
    }

    const category = await SkillCategory.findByIdAndUpdate(
      id,
      {
        nameEn,
        nameAr: String(body.nameAr || ''),
        slug: slugify(String(body.slug || nameEn)),
        descriptionEn: String(body.descriptionEn || ''),
        descriptionAr: String(body.descriptionAr || ''),
        icon: String(body.icon || 'Brain'),
        visible: Boolean(body.visible),
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      },
      { new: true, runValidators: true }
    ).lean();

    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    revalidatePath('/');

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'skill-category',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { nameEn: category.nameEn, slug: category.slug },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(category)));
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to update skill category.');
    return NextResponse.json({ success: false, message }, { status });
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
    await SkillCategory.findByIdAndDelete(id);
    revalidatePath('/');

    await logAuditEvent({
      request,
      action: 'delete',
      entityType: 'skill-category',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to delete skill category.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
