import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Skill from '@/models/Skill';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const adminMode = searchParams.get('admin') === 'true';
    const query = adminMode ? {} : { visible: true };
    const skills = await Skill.find(query).sort({ category: 1, order: 1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(skills)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const skill = await Skill.create(body);
    return NextResponse.json(JSON.parse(JSON.stringify(skill.toObject())), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
