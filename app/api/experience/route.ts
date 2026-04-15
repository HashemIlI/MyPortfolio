import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Experience from '@/models/Experience';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const adminMode = searchParams.get('admin') === 'true';
    const query = adminMode ? {} : { visible: true };
    const experience = await Experience.find(query).sort({ order: 1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(experience)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch experience' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const exp = await Experience.create(body);
    return NextResponse.json(JSON.parse(JSON.stringify(exp.toObject())), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create experience' }, { status: 500 });
  }
}
