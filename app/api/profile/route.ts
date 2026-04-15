import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import { requireAuth } from '@/lib/apiAuth';

export async function GET() {
  try {
    await connectDB();
    const existingProfile = await Profile.findOne().lean();
    const profile = existingProfile ?? (await Profile.create({})).toObject();
    return NextResponse.json(JSON.parse(JSON.stringify(profile)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const profile = await Profile.findOneAndUpdate({}, body, {
      upsert: true,
      new: true,
      runValidators: true,
    }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(profile)));
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
