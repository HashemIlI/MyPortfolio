'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Copy, Check, Image as ImageIcon, FileText, Loader2, FolderOpen, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type FileEntry = {
  name: string;
  url: string;
  size: number;
  type: 'image' | 'pdf' | 'file';
  modified: string;
};

const SUBDIRS = ['general', 'projects', 'profile', 'certifications'];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaAdminPage() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [subdir, setSubdir] = useState('general');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deleteUrl, setDeleteUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/media?subdir=${subdir}`);
      const data = await res.json();
      if (!res.ok) {
        setFiles([]);
        setServerMessage(typeof data.message === 'string' ? data.message : 'Failed to load files');
        return;
      }
      setServerMessage('');
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch {
      setServerMessage('');
      toast({ title: 'Failed to load files', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [subdir]);

  useEffect(() => { load(); }, [load]);

  async function uploadFiles(selectedFiles: FileList | null) {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploading(true);
    let uploaded = 0;
    let failed = 0;
    for (const file of Array.from(selectedFiles)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('subdir', subdir);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (res.ok) {
          uploaded++;
          setServerMessage('');
        } else {
          failed++;
          const data = await res.json().catch(() => null);
          if (typeof data?.message === 'string') setServerMessage(data.message);
        }
      } catch {
        failed++;
      }
    }
    setUploading(false);
    if (uploaded > 0) toast({ title: `${uploaded} file(s) uploaded`, variant: 'success' });
    if (failed > 0) toast({ title: `${failed} file(s) failed`, variant: 'destructive' });
    load();
  }

  async function handleDelete(url: string) {
    try {
      const res = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (typeof data?.message === 'string') setServerMessage(data.message);
        throw new Error();
      }
      setServerMessage('');
      toast({ title: 'File deleted', variant: 'success' });
      setFiles((prev) => prev.filter((f) => f.url !== url));
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setDeleteUrl(null);
    }
  }

  function copyUrl(url: string) {
    // Blob URLs are absolute (https://); local dev URLs are relative (/uploads/...)
    const fullUrl = url.startsWith('https://') ? url : window.location.origin + url;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl)
        .then(() => { setCopiedUrl(url); setTimeout(() => setCopiedUrl(null), 2000); })
        .catch(() => { fallbackCopy(fullUrl); setCopiedUrl(url); setTimeout(() => setCopiedUrl(null), 2000); });
    } else {
      fallbackCopy(fullUrl);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  }

  function fallbackCopy(text: string) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch { /* silent */ }
    document.body.removeChild(ta);
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Media Library</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{files.length} file{files.length !== 1 ? 's' : ''} in /{subdir}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Folder tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit overflow-x-auto border border-white/10 bg-black/20">
        {SUBDIRS.map((dir) => (
          <button
            key={dir}
            onClick={() => setSubdir(dir)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              subdir === dir ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderOpen className="h-3 w-3" />
            {dir}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-6 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
        }`}
      >
        <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Drop files here or <span className="text-emerald-400">click to upload</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP, GIF, PDF · Max 10MB each</p>
      </div>

      {serverMessage && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {serverMessage}
        </div>
      )}

      {/* File grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-16 text-center text-muted-foreground">
          No files in this folder. Upload something to get started.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <div
              key={file.url}
              className="group rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-white/20 transition-all"
            >
              {/* Preview */}
              <div className="aspect-square bg-black/30 flex items-center justify-center relative overflow-hidden">
                {file.type === 'image' ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : file.type === 'pdf' ? (
                  <FileText className="h-10 w-10 text-red-400" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyUrl(file.url)}
                    className="p-2 rounded-lg bg-black/60 hover:bg-emerald-600 text-white transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl === file.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => setDeleteUrl(file.url)}
                    className="p-2 rounded-lg bg-black/60 hover:bg-red-600 text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs text-foreground/80 truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{formatBytes(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#101310] rounded-xl p-6 max-w-sm w-full border border-white/10">
            <h3 className="font-semibold text-foreground mb-2">Delete File?</h3>
            <p className="text-muted-foreground text-sm mb-1 truncate">{deleteUrl.split('/').pop()}</p>
            <p className="text-muted-foreground/60 text-xs mb-5">This is permanent and cannot be undone. Make sure this file isn&apos;t referenced anywhere.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteUrl(null)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
              <button onClick={() => handleDelete(deleteUrl)} className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
