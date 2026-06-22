import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import SkillCategory from '@/models/SkillCategory';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { getApiErrorDetails } from '@/lib/api-error';
import { readSanitizedJsonObject } from '@/lib/security';
import { slugify } from '@/lib/utils';

async function nextSortOrder() {
  const last = await SkillCategory.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
  return Number(last?.sortOrder ?? -1) + 1;
}

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
    const categories = await SkillCategory.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean();

    return NextResponse.json({ categories: JSON.parse(JSON.stringify(categories)) });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to fetch skill categories.');
    return NextResponse.json({ success: false, message }, { status });
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
      return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
    }

    const nameEn = String(body.nameEn || '').trim();
    if (!nameEn) {
      return NextResponse.json({ success: false, message: 'Category name is required.' }, { status: 400 });
    }

    const payload = {
      nameEn,
      nameAr: String(body.nameAr || ''),
      slug: slugify(String(body.slug || nameEn)),
      descriptionEn: String(body.descriptionEn || ''),
      descriptionAr: String(body.descriptionAr || ''),
      icon: String(body.icon || 'Brain'),
      visible: 'visible' in body ? Boolean(body.visible) : true,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : await nextSortOrder(),
    };

    const category = await SkillCategory.create(payload);
    revalidatePath('/');

    await logAuditEvent({
      request,
      action: 'create',
      entityType: 'skill-category',
      entityId: String(category._id),
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { nameEn: category.nameEn, slug: category.slug },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(category.toObject())), { status: 201 });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to create skill category.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
