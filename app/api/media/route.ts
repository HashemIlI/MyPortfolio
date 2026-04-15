import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';
import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function GET(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        success: false,
        message: 'Local media browsing is not supported on Vercel. Use an external storage provider for uploaded files.',
      },
      { status: 501 }
    );
  }

  try {
    if (!existsSync(UPLOAD_DIR)) {
      return NextResponse.json({ files: [], subdirs: [] });
    }

    const { searchParams } = new URL(request.url);
    const subdir = searchParams.get('subdir') || '';
    const safeSubdir = subdir.replace(/[^a-zA-Z0-9_-]/g, '');

    const targetDir = safeSubdir ? join(UPLOAD_DIR, safeSubdir) : UPLOAD_DIR;

    if (!existsSync(targetDir)) {
      return NextResponse.json({ files: [], subdirs: [] });
    }

    const entries = await readdir(targetDir, { withFileTypes: true });
    const files: Array<{ name: string; url: string; size: number; type: string; modified: string }> = [];
    const subdirs: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        subdirs.push(entry.name);
      } else {
        const filePath = join(targetDir, entry.name);
        const fileStat = await stat(filePath);
        const url = safeSubdir
          ? `/uploads/${safeSubdir}/${entry.name}`
          : `/uploads/${entry.name}`;

        const ext = entry.name.split('.').pop()?.toLowerCase() || '';
        const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        const type = imageExts.includes(ext) ? 'image' : ext === 'pdf' ? 'pdf' : 'file';

        files.push({
          name: entry.name,
          url,
          size: fileStat.size,
          type,
          modified: fileStat.mtime.toISOString(),
        });
      }
    }

    files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return NextResponse.json({ files, subdirs });
  } catch {
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        success: false,
        message: 'Local media deletion is not supported on Vercel. Use an external storage provider for uploaded files.',
      },
      { status: 501 }
    );
  }

  try {
    const { url: fileUrl } = await request.json();
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    const relativePath = fileUrl.replace('/uploads/', '');
    const safePath = relativePath.replace(/\.\./g, '');
    const filePath = join(UPLOAD_DIR, safePath);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await unlink(filePath);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
