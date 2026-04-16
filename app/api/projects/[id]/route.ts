import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { getAuthContext, requireAuth } from '@/lib/apiAuth';
import { logAuditEvent } from '@/lib/audit-log';
import { slugify } from '@/lib/utils';
import { getApiErrorDetails } from '@/lib/api-error';
import { readSanitizedJsonObject, sanitizeStringArray } from '@/lib/security';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const project = await Project.findById(id).lean();
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(project)));
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to fetch project.');
    return NextResponse.json({ success: false, message }, { status });
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
      return NextResponse.json(
        { success: false, message: 'Invalid request body.' },
        { status: 400 }
      );
    }

    if (!body.slug && body.titleEn) {
      body.slug = slugify(String(body.titleEn));
    }
    if (body.slug) {
      body.slug = slugify(String(body.slug));
    }
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

    const project = await Project.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await logAuditEvent({
      request,
      action: 'update',
      entityType: 'project',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
      details: {
        titleEn: project.titleEn,
        slug: project.slug,
      },
    });

    return NextResponse.json(JSON.parse(JSON.stringify(project)));
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to update project.');
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
    await Project.findByIdAndDelete(id);

    await logAuditEvent({
      request,
      action: 'delete',
      entityType: 'project',
      entityId: id,
      actorUsername: authContext?.username ?? '',
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to delete project.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
