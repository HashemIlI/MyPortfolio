import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';
import { requireAuth } from '@/lib/apiAuth';
import { getApiErrorDetails } from '@/lib/api-error';
import { readSanitizedJsonObject, sanitizeString, sanitizeStringArray } from '@/lib/security';

export async function PUT(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await readSanitizedJsonObject<Record<string, unknown>>(request);
    const category = typeof body?.category === 'string' ? sanitizeString(body.category) : '';
    const ids = sanitizeStringArray(body?.ids);

    if (!category) {
      return NextResponse.json({ success: false, message: 'No category provided.' }, { status: 400 });
    }
    if (ids.length === 0) {
      return NextResponse.json({ success: false, message: 'No skill ids provided.' }, { status: 400 });
    }

    // Scoping the filter to the category makes cross-category reordering impossible.
    await Promise.all(
      ids.map((id, index) => Skill.updateOne({ _id: id, category }, { $set: { order: index } }))
    );
    revalidatePath('/');
    revalidatePath('/', 'layout');

    const skills = await Skill.find({ category }).sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, skills: JSON.parse(JSON.stringify(skills)) });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to reorder skills.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
