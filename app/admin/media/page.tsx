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
          if (typeof data?.message === 'string') {
            setServerMessage(data.message);
          }
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
        if (typeof data?.message === 'string') {
          setServerMessage(data.message);
        }
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
    const fullUrl = window.location.origin + url;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
      }).catch(() => {
        // Fallback for non-HTTPS or permission denied
        fallbackCopy(fullUrl);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
      });
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
          <h1 className="text-xl font-bold text-gray-100">Media Library</h1>
          <p className="text-gray-400 text-sm mt-0.5">{files.length} file{files.length !== 1 ? 's' : ''} in /{subdir}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" title="Refresh">
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
      <div className="flex gap-1 mb-6 p-1 bg-gray-800 rounded-lg w-fit overflow-x-auto">
        {SUBDIRS.map((dir) => (
          <button
            key={dir}
            onClick={() => setSubdir(dir)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              subdir === dir ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'
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
          dragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
        }`}
      >
        <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          Drop files here or <span className="text-emerald-400">click to upload</span>
        </p>
        <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP, GIF, PDF · Max 10MB each</p>
      </div>

      {serverMessage && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {serverMessage}
        </div>
      )}

      {/* File grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : files.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-16 text-center text-gray-500">
          No files in this folder. Upload something to get started.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <div
              key={file.url}
              className="group bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all"
            >
              {/* Preview */}
              <div className="aspect-square bg-gray-900 flex items-center justify-center relative overflow-hidden">
                {file.type === 'image' ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : file.type === 'pdf' ? (
                  <FileText className="h-10 w-10 text-red-400" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-500" />
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyUrl(file.url)}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-emerald-600 text-white transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl === file.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => setDeleteUrl(file.url)}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-red-600 text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs text-gray-300 truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{formatBytes(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <h3 className="font-bold text-gray-100 mb-2">Delete File?</h3>
            <p className="text-gray-400 text-sm mb-1 truncate">{deleteUrl}</p>
            <p className="text-gray-500 text-xs mb-5">This cannot be undone. Make sure this file isn&apos;t referenced anywhere.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteUrl(null)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
              <button onClick={() => handleDelete(deleteUrl)} className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
