import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Education from '@/models/Education';
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
      return NextResponse.json({ success: false, message: 'No education ids provided.' }, { status: 400 });
    }

    await Promise.all(
      ids.map((id, index) =>
        Education.findByIdAndUpdate(id, { order: index }, { runValidators: true })
      )
    );
    revalidatePath('/');

    const education = await Education.find().sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, education: JSON.parse(JSON.stringify(education)) });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to reorder education entries.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
