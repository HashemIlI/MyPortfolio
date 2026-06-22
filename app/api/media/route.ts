import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg']);

function typeFromExt(filename: string): 'image' | 'pdf' | 'file' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'file';
}

export async function GET(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const rawSubdir = searchParams.get('subdir') || 'general';
  const safeSubdir = rawSubdir.replace(/[^a-zA-Z0-9_-]/g, '');

  if (process.env.VERCEL) {
    try {
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: `${safeSubdir}/`, limit: 1000 });

      const files = blobs.map((blob) => {
        const name = blob.pathname.split('/').pop() ?? blob.pathname;
        return {
          name,
          url: blob.url,
          size: blob.size,
          type: typeFromExt(name),
          modified: blob.uploadedAt.toISOString(),
        };
      });

      files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
      return NextResponse.json({ files });
    } catch {
      return NextResponse.json({ success: false, message: 'Failed to list files from Blob store' }, { status: 500 });
    }
  }

  // Local dev: read from filesystem
  try {
    const { readdir, stat } = await import('fs/promises');
    const { join } = await import('path');
    const { existsSync } = await import('fs');

    const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
    const targetDir = safeSubdir ? join(UPLOAD_DIR, safeSubdir) : UPLOAD_DIR;

    if (!existsSync(targetDir)) {
      return NextResponse.json({ files: [] });
    }

    const entries = await readdir(targetDir, { withFileTypes: true });
    const files: Array<{ name: string; url: string; size: number; type: string; modified: string }> = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        const fileStat = await stat(join(targetDir, entry.name));
        files.push({
          name: entry.name,
          url: safeSubdir ? `/uploads/${safeSubdir}/${entry.name}` : `/uploads/${entry.name}`,
          size: fileStat.size,
          type: typeFromExt(entry.name),
          modified: fileStat.mtime.toISOString(),
        });
      }
    }

    files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to list files' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const fileUrl = typeof body?.url === 'string' ? body.url : '';

    if (!fileUrl) {
      return NextResponse.json({ success: false, message: 'Invalid file URL' }, { status: 400 });
    }

    if (process.env.VERCEL) {
      if (!fileUrl.includes('blob.vercel-storage.com')) {
        return NextResponse.json({ success: false, message: 'Invalid Blob URL' }, { status: 400 });
      }
      const { del } = await import('@vercel/blob');
      await del(fileUrl);
      return NextResponse.json({ success: true });
    }

    // Local dev
    if (!fileUrl.startsWith('/uploads/')) {
      return NextResponse.json({ success: false, message: 'Invalid file URL' }, { status: 400 });
    }

    const { unlink } = await import('fs/promises');
    const { join } = await import('path');
    const { existsSync } = await import('fs');

    const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
    const safePath = fileUrl.replace('/uploads/', '').replace(/\.\./g, '');
    const filePath = join(UPLOAD_DIR, safePath);

    if (!existsSync(filePath)) {
      return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
    }

    await unlink(filePath);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete file' }, { status: 500 });
  }
}
