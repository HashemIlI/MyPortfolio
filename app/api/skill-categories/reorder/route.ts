import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import SkillCategory from '@/models/SkillCategory';
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
      return NextResponse.json({ success: false, message: 'No skill category ids provided.' }, { status: 400 });
    }

    await Promise.all(
      ids.map((id, index) =>
        SkillCategory.findByIdAndUpdate(id, { sortOrder: index }, { runValidators: true })
      )
    );
    revalidatePath('/');
    revalidatePath('/', 'layout');

    const categories = await SkillCategory.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
    return NextResponse.json({ success: true, categories: JSON.parse(JSON.stringify(categories)) });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to reorder skill categories.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
