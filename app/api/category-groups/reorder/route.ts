import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import CategoryGroup from '@/models/CategoryGroup';
import { requireAuth } from '@/lib/apiAuth';
import { getApiErrorDetails } from '@/lib/api-error';
import { readSanitizedJsonObject, sanitizeStringArray } from '@/lib/security';

export async function PUT(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await readSanitizedJsonObject<Record<string, unknown>>(request);
    const ids = sanitizeStringArray(body?.ids);
    if (ids.length === 0) {
      return NextResponse.json({ success: false, message: 'No category group ids provided.' }, { status: 400 });
    }

    await Promise.all(
      ids.map((id, index) =>
        CategoryGroup.findByIdAndUpdate(id, { sortOrder: index }, { runValidators: true })
      )
    );
    revalidatePath('/');

    const groups = await CategoryGroup.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
    return NextResponse.json({ success: true, groups: JSON.parse(JSON.stringify(groups)) });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to reorder category groups.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
