'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ExperienceData } from '@/types/content';

type FormData = {
  titleEn: string; titleAr: string;
  companyEn: string; companyAr: string;
  durationEn: string; durationAr: string;
  bulletsEnRaw: string; bulletsArRaw: string;
  toolsRaw: string;
  metaTitle: string; metaDescription: string; metaKeywordsRaw: string; ogImage: string;
  current: boolean; visible: boolean; order: number;
};
const EMPTY: FormData = {
  titleEn: '', titleAr: '', companyEn: '', companyAr: '',
  durationEn: '', durationAr: '', bulletsEnRaw: '', bulletsArRaw: '',
  toolsRaw: '', metaTitle: '', metaDescription: '', metaKeywordsRaw: '', ogImage: '', current: false, visible: true, order: 0,
};

export default function ExperienceAdminPage() {
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<ExperienceData | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    const data = await fetch('/api/experience?admin=true').then((r) => r.json());
    setExperiences(Array.isArray(data) ? data : []);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(e: ExperienceData) {
    setEditing(e);
    setForm({
      titleEn: e.titleEn, titleAr: e.titleAr || '',
      companyEn: e.companyEn, companyAr: e.companyAr || '',
      durationEn: e.durationEn, durationAr: e.durationAr || '',
      bulletsEnRaw: e.bulletsEn?.join('\n') || '',
      bulletsArRaw: e.bulletsAr?.join('\n') || '',
      toolsRaw: e.tools?.join(', ') || '',
      metaTitle: e.metaTitle || '',
      metaDescription: e.metaDescription || '',
      metaKeywordsRaw: e.metaKeywords?.join(', ') || '',
      ogImage: e.ogImage || '',
      current: e.current, visible: e.visible, order: e.order,
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.titleEn || !form.companyEn) return;
    setSaving(true);
    const payload = {
      titleEn: form.titleEn, titleAr: form.titleAr,
      companyEn: form.companyEn, companyAr: form.companyAr,
      durationEn: form.durationEn, durationAr: form.durationAr,
      bulletsEn: form.bulletsEnRaw.split('\n').map((s) => s.trim()).filter(Boolean),
      bulletsAr: form.bulletsArRaw.split('\n').map((s) => s.trim()).filter(Boolean),
      tools: form.toolsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      metaKeywords: form.metaKeywordsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      ogImage: form.ogImage,
      current: form.current, visible: form.visible, order: form.order,
    };
    try {
      const res = await fetch(
        editing ? `/api/experience/${editing._id}` : '/api/experience',
        { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      if (!res.ok) throw new Error();
      toast({ title: editing ? 'Updated!' : 'Added!', variant: 'success' });
      setModal(false); load();
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/experience/${id}`, { method: 'DELETE' });
    setDeleteId(null); toast({ title: 'Deleted' }); load();
  }

  return (
    <div className="max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Experience</h1>
          <p className="text-gray-400 text-sm mt-0.5">{experiences.length} entr{experiences.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Add Experience
        </button>
      </div>

      <div className="space-y-3">
        {experiences.map((exp) => (
          <div key={String(exp._id)} className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-100 truncate">{exp.titleEn}</div>
              <div className="text-sm text-emerald-400 truncate">{exp.companyEn}</div>
              <div className="text-xs text-gray-500 mt-1">{exp.durationEn}</div>
              {exp.tools?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {exp.tools.slice(0, 4).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 text-xs">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 self-end shrink-0">
              <button onClick={() => openEdit(exp)} className="text-gray-400 hover:text-emerald-400"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => setDeleteId(String(exp._id))} className="text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {experiences.length === 0 && (
          <div className="text-center text-gray-500 py-12">No experience yet.</div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl my-8 shadow-2xl border border-gray-700">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h2 className="font-bold text-gray-100">{editing ? 'Edit Experience' : 'Add Experience'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
            </div>
            <div className="p-4 space-y-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Title (EN) *" val={form.titleEn} set={(v) => setForm({ ...form, titleEn: v })} />
                <F label="Title (AR)" val={form.titleAr} set={(v) => setForm({ ...form, titleAr: v })} dir="rtl" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Company (EN) *" val={form.companyEn} set={(v) => setForm({ ...form, companyEn: v })} />
                <F label="Company (AR)" val={form.companyAr} set={(v) => setForm({ ...form, companyAr: v })} dir="rtl" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Duration (EN)" val={form.durationEn} set={(v) => setForm({ ...form, durationEn: v })} placeholder="2024 – 2025 · 9 Months" />
                <F label="Duration (AR)" val={form.durationAr} set={(v) => setForm({ ...form, durationAr: v })} dir="rtl" />
              </div>
              <T label="Bullets (EN) — one per line" val={form.bulletsEnRaw} set={(v) => setForm({ ...form, bulletsEnRaw: v })} rows={5} />
              <T label="Bullets (AR) — one per line" val={form.bulletsArRaw} set={(v) => setForm({ ...form, bulletsArRaw: v })} rows={5} dir="rtl" />
              <F label="Tools (comma-separated)" val={form.toolsRaw} set={(v) => setForm({ ...form, toolsRaw: v })} placeholder="Python, Pandas, Power BI" />
              <F label="Meta Title" val={form.metaTitle} set={(v) => setForm({ ...form, metaTitle: v })} placeholder="Overrides global title for this experience page" />
              <T label="Meta Description" val={form.metaDescription} set={(v) => setForm({ ...form, metaDescription: v })} rows={3} />
              <F label="Meta Keywords (comma-separated)" val={form.metaKeywordsRaw} set={(v) => setForm({ ...form, metaKeywordsRaw: v })} placeholder="analytics, leadership, sql" />
              <F label="OG Image" val={form.ogImage} set={(v) => setForm({ ...form, ogImage: v })} placeholder="https://... or /uploads/..." />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <CheckF label="Current Role" checked={form.current} set={(v) => setForm({ ...form, current: v })} />
                <CheckF label="Visible" checked={form.visible} set={(v) => setForm({ ...form, visible: v })} />
                <div className="w-full sm:ml-auto sm:w-24">
                  <F label="Order" val={String(form.order)} set={(v) => setForm({ ...form, order: Number(v) })} type="number" />
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse justify-end gap-3 p-4 pt-0 sm:flex-row sm:p-5 sm:pt-0">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.titleEn}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <h3 className="font-bold text-gray-100 mb-2">Delete?</h3>
            <p className="text-gray-400 text-sm mb-5">This cannot be undone.</p>
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, val, set, type = 'text', placeholder = '', dir }: {
  label: string; val: string; set: (v: string) => void; type?: string; placeholder?: string; dir?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input type={type} value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder} dir={dir}
        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-emerald-500" />
    </div>
  );
}
function T({ label, val, set, rows = 3, dir }: { label: string; val: string; set: (v: string) => void; rows?: number; dir?: string; }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <textarea rows={rows} value={val} onChange={(e) => set(e.target.value)} dir={dir}
        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
    </div>
  );
}
function CheckF({ label, checked, set }: { label: string; checked: boolean; set: (v: boolean) => void; }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="h-4 w-4 rounded accent-emerald-500" />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
}
