import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import CategoryGroup from '@/models/CategoryGroup';
import Project, { PROJECT_CATEGORIES, type ProjectCategory } from '@/models/Project';
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

async function nextSortOrder() {
  const last = await CategoryGroup.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
  return Number(last?.sortOrder ?? -1) + 1;
}

async function ensureDefaultCategoryGroups() {
  const count = await CategoryGroup.countDocuments();
  if (count > 0) return;

  await CategoryGroup.insertMany(
    PROJECT_CATEGORIES.map((category, index) => ({
      name: category,
      slug: slugify(category),
      sourceCategories: [category],
      visible: true,
      sortOrder: index,
    }))
  );
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
    await ensureDefaultCategoryGroups();

    const query = adminMode ? {} : { visible: true };
    const [groups, categories] = await Promise.all([
      CategoryGroup.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean(),
      adminMode ? Project.distinct('category') : Promise.resolve([]),
    ]);

    return NextResponse.json({
      groups: JSON.parse(JSON.stringify(groups)),
      sourceCategories: adminMode ? categories : PROJECT_CATEGORIES,
      allSourceCategories: PROJECT_CATEGORIES,
    });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to fetch category groups.');
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

    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ success: false, message: 'Group name is required.' }, { status: 400 });
    }

    const payload = {
      name,
      slug: slugify(String(body.slug || name)),
      description: String(body.description || ''),
      sourceCategories: normalizeSourceCategories(body.sourceCategories),
      visible: 'visible' in body ? Boolean(body.visible) : true,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : await nextSortOrder(),
    };

    const group = await CategoryGroup.create(payload);
    revalidatePath('/');
    await logAuditEvent({
      request,
      action: 'create',
      entityType: 'category-group',
      entityId: String(group._id),
      actorUsername: authContext?.username ?? '',
      success: true,
      details: { name: group.name, slug: group.slug, sourceCategories: group.sourceCategories },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(group.toObject())), { status: 201 });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to create category group.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
