import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function GET() {
  try {
    await connectDB();
    const profile = await Profile.findOne()
      .sort({ updatedAt: -1, createdAt: -1 })
      .select('cvFile nameEn')
      .lean();

    const cvFile = (profile as { cvFile?: string } | null)?.cvFile?.trim();
    if (!cvFile) {
      return new NextResponse('CV not available', { status: 404 });
    }

    const rawName = (profile as { nameEn?: string } | null)?.nameEn?.trim() || 'CV';
    const filename = rawName.replace(/\s+/g, '_') + '_CV.pdf';

    let buffer: ArrayBuffer;

    if (cvFile.startsWith('http://') || cvFile.startsWith('https://')) {
      const upstream = await fetch(cvFile);
      if (!upstream.ok) {
        return new NextResponse('Failed to retrieve CV', { status: 502 });
      }
      buffer = await upstream.arrayBuffer();
    } else {
      // Local /uploads/ path (dev environment)
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const filePath = join(process.cwd(), 'public', cvFile);
      const bytes = await readFile(filePath);
      buffer = bytes.buffer as ArrayBuffer;
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[download-cv]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
