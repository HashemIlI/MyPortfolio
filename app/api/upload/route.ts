import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

export async function POST(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50);
    const filename = `${timestamp}_${safeName}`;
    const subdir = (formData.get('subdir') as string | null) ?? 'general';
    const safeSubdir = subdir.replace(/[^a-zA-Z0-9_-]/g, '');

    if (process.env.VERCEL) {
      // Production: use Vercel Blob
      const { put } = await import('@vercel/blob');
      const blob = await put(`${safeSubdir}/${filename}`, file, {
        access: 'public',
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url, filename });
    }

    // Development: write to public/uploads/
    const { writeFile, mkdir } = await import('fs/promises');
    const { join } = await import('path');
    const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
    const uploadPath = join(UPLOAD_DIR, safeSubdir);
    await mkdir(uploadPath, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(join(uploadPath, filename), Buffer.from(bytes));
    const url = `/uploads/${safeSubdir}/${filename}`;
    return NextResponse.json({ url, filename });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
