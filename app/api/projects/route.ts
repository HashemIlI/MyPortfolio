import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { requireAuth } from '@/lib/apiAuth';
import { slugify } from '@/lib/utils';
import { getApiErrorDetails } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const adminMode = searchParams.get('admin') === 'true';
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
    await connectDB();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.' },
        { status: 400 }
      );
    }

    if (!body.slug) body.slug = slugify(body.titleEn || '');
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
    if (!body.titleEn || !body.slug) {
      return NextResponse.json(
        { success: false, message: 'Title (EN) and slug are required.' },
        { status: 400 }
      );
    }

    const project = await Project.create(body);
    return NextResponse.json(JSON.parse(JSON.stringify(project.toObject())), { status: 201 });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to create project.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
