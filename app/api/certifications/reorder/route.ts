import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Certification from '@/models/Certification';
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
      return NextResponse.json({ success: false, message: 'No certification ids provided.' }, { status: 400 });
    }

    await Promise.all(
      ids.map((id, index) =>
        Certification.findByIdAndUpdate(id, { order: index }, { runValidators: true })
      )
    );
    revalidatePath('/');

    const certs = await Certification.find().sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, certs: JSON.parse(JSON.stringify(certs)) });
  } catch (error) {
    const { message, status } = getApiErrorDetails(error, 'Failed to reorder certifications.');
    return NextResponse.json({ success: false, message }, { status });
  }
}
