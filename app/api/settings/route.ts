import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();
    const existingSettings = await SiteSettings.findOne().lean();
    const settings = existingSettings ?? (await SiteSettings.create({})).toObject();
    return NextResponse.json(JSON.parse(JSON.stringify(settings)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const settings = await SiteSettings.findOneAndUpdate({}, body, {
      upsert: true,
      new: true,
      runValidators: true,
    }).lean();
    revalidatePath('/');
    revalidatePath('/', 'layout');
    revalidatePath('/admin/settings');
    return NextResponse.json(JSON.parse(JSON.stringify(settings)));
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
