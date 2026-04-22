import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
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

  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        success: false,
        message: 'Local file uploads are not supported on Vercel. Use an external storage provider for media uploads.',
      },
      { status: 501 }
    );
  }

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
    const subdir = formData.get('subdir') as string || 'general';

    // Sanitize subdir to prevent path traversal
    const safeSubdir = subdir.replace(/[^a-zA-Z0-9_-]/g, '');
    const uploadPath = join(UPLOAD_DIR, safeSubdir);

    await mkdir(uploadPath, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadPath, filename), buffer);

    const url = `/uploads/${safeSubdir}/${filename}`;
    return NextResponse.json({ url, filename });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
