import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Certification from '@/models/Certification';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const adminMode = searchParams.get('admin') === 'true';
    const query = adminMode ? {} : { visible: true };
    const certs = await Certification.find(query).sort({ order: 1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(certs)));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const cert = await Certification.create(body);
    return NextResponse.json(JSON.parse(JSON.stringify(cert.toObject())), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create certification' }, { status: 500 });
  }
}
