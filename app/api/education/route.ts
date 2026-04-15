import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Education from '@/models/Education';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    await connectDB();
    const filter = isAdmin ? {} : { visible: true };
    const education = await Education.find(filter).sort({ order: 1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(education)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch education' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const education = await Education.create(body);
    return NextResponse.json(JSON.parse(JSON.stringify(education.toObject())), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create education' }, { status: 500 });
  }
}
