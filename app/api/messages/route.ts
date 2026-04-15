import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    await connectDB();
    const messages = await Message.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(messages)));
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    await connectDB();
    await Message.findByIdAndUpdate(body.id, { read: Boolean(body.read) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to update message' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json().catch(() => null);
    if (!body || typeof body.id !== 'string' || !body.id.trim()) {
      return NextResponse.json(
        { success: false, message: 'Missing id' },
        { status: 400 }
      );
    }

    await connectDB();
    await Message.findByIdAndDelete(body.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
