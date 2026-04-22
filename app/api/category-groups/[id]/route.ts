import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import CategoryGroup from '@/models/CategoryGroup';
import { PROJECT_CATEGORIES, type ProjectCategory } from '@/models/Project';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { getApiErrorDetails } from '@/lib/api-error';
import { readSanitizedJsonObject, sanitizeStringArray } from '@/lib/security';
import { slugify } from '@/lib/utils';

const validCategories = new Set<string>(PROJECT_CATEGORIES);

function normalizeSourceCategories(value: unknown): ProjectCategory[] {
  return sanitizeStringArray(value).filter((category): category is ProjectCategory =>
    validCategories.has(category)
  );
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
      return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
    }

    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ success: false, message: 'Group name is required.' }, { status: 400 });
    }

    const group = await CategoryGroup.findByIdAndUpdate(
      id,
      {
        name,
        slug: slugify(String(body.slug || name)),
        description: String(body.description || ''),
        sourceCategories: normalizeSourceCategories(body.sourceCategories),
        visible: Boolean(body.visible),
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      },
      { new: true, runValidators: true }
    ).lean();

    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    revalidatePath('/');

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'category-group',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { name: group.name, slug: group.slug, sourceCategories: group.sourceCategories },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(group)));
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to update category group.');
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
    await CategoryGroup.findByIdAndDelete(id);
    revalidatePath('/');

    await logAuditEvent({
      request,
      action: 'delete',
      entityType: 'category-group',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to delete category group.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
