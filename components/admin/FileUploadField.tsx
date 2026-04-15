'use client';
import { useRef, useState } from 'react';
import { Check, Loader2, Upload } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  subdir?: string;
  placeholder?: string;
}

export default function FileUploadField({
  label,
  value,
  onChange,
  accept = 'image/*,.pdf',
  subdir = 'general',
  placeholder = '',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploaded(false);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('subdir', subdir);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
        setUploaded(true);
        setTimeout(() => setUploaded(false), 2000);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'URL or upload →'}
          className="admin-control flex-1 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="admin-secondary-btn flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 sm:self-auto"
          title="Upload file"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : uploaded ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? 'Uploading…' : uploaded ? 'Uploaded!' : 'Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = '';
          }}
        />
      </div>
      {value && (
        <div className="mt-2">
          {value.endsWith('.pdf') ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline">
              View PDF →
            </a>
          ) : (
            <img src={value} alt="preview" className="mt-1 h-12 w-12 rounded-lg border border-white/10 object-cover" />
          )}
        </div>
      )}
    </div>
  );
}
