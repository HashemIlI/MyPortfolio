import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json();

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  await connectDB();
  const newMessage = await Message.create({ name, email, subject: subject?.trim() || '', message });
  return NextResponse.json(
    { success: true, id: newMessage._id },
    { status: 201 }
  );
}
