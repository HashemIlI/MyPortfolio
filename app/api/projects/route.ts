import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { slugify } from '@/lib/utils';
import { getApiErrorDetails } from '@/lib/api-error';
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
    const category = searchParams.get('category');

    const query: Record<string, unknown> = adminMode ? {} : { visible: true };
    if (category) query.category = category;

    const projects = await Project.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    return NextResponse.json(JSON.parse(JSON.stringify(projects)));
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to fetch projects.');
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
      return NextResponse.json(
        { success: false, message: 'Invalid request body.' },
        { status: 400 }
      );
    }

    if (!body.slug) body.slug = slugify(String(body.titleEn || ''));
    body.slug = slugify(String(body.slug || ''));
    if ('featuredOnHomepage' in body) {
      body.featuredOnHomepage = Boolean(body.featuredOnHomepage);
    }
    if ('homepageCategoryOrder' in body) {
      body.homepageCategoryOrder = Number.isFinite(Number(body.homepageCategoryOrder))
        ? Number(body.homepageCategoryOrder)
        : 999;
    }
    if ('displayOrder' in body) {
      body.displayOrder = Number.isFinite(Number(body.displayOrder))
        ? Number(body.displayOrder)
        : 0;
    }
    if ('tools' in body) {
      body.tools = sanitizeStringArray(body.tools);
    }
    if ('metaKeywords' in body) {
      body.metaKeywords = sanitizeStringArray(body.metaKeywords);
    }
    if ('screenshots' in body) {
      body.screenshots = sanitizeStringArray(body.screenshots);
    }
    if (!body.titleEn || !body.slug) {
      return NextResponse.json(
        { success: false, message: 'Title (EN) and slug are required.' },
        { status: 400 }
      );
    }

    const project = await Project.create(body);
    await logAuditEvent({
      request,
      action: 'create',
      entityType: 'project',
      entityId: String(project._id),
      actorUsername: authContext?.username ?? '',
      success: true,
      details: {
        titleEn: project.titleEn,
        slug: project.slug,
      },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(project.toObject())), { status: 201 });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to create project.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
