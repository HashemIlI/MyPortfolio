'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { EducationData } from '@/types/content';

type FormData = {
  degreeEn: string; degreeAr: string;
  institutionEn: string; institutionAr: string;
  fieldOfStudyEn: string; fieldOfStudyAr: string;
  startDate: string; endDate: string;
  descriptionEn: string; descriptionAr: string;
  grade: string; logo: string;
  visible: boolean; order: number;
};
const EMPTY: FormData = {
  degreeEn: '', degreeAr: '', institutionEn: '', institutionAr: '',
  fieldOfStudyEn: '', fieldOfStudyAr: '', startDate: '', endDate: '',
  descriptionEn: '', descriptionAr: '', grade: '', logo: '',
  visible: true, order: 0,
};

export default function EducationAdminPage() {
  const [items, setItems] = useState<EducationData[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<EducationData | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    const data = await fetch('/api/education?admin=true').then((r) => r.json());
    setItems(Array.isArray(data) ? data : []);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(e: EducationData) {
    setEditing(e);
    setForm({
      degreeEn: e.degreeEn, degreeAr: e.degreeAr || '',
      institutionEn: e.institutionEn, institutionAr: e.institutionAr || '',
      fieldOfStudyEn: e.fieldOfStudyEn || '', fieldOfStudyAr: e.fieldOfStudyAr || '',
      startDate: e.startDate || '', endDate: e.endDate || '',
      descriptionEn: e.descriptionEn || '', descriptionAr: e.descriptionAr || '',
      grade: e.grade || '', logo: e.logo || '',
      visible: e.visible, order: e.order,
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.degreeEn || !form.institutionEn) return;
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/education/${editing._id}` : '/api/education',
        { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }
      );
      if (!res.ok) throw new Error();
      toast({ title: editing ? 'Updated!' : 'Added!', variant: 'success' });
      setModal(false); load();
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/education/${id}`, { method: 'DELETE' });
    setDeleteId(null); toast({ title: 'Deleted' }); load();
  }

  return (
    <div className="max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Education</h1>
          <p className="text-gray-400 text-sm mt-0.5">{items.length} entr{items.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Add Education
        </button>
      </div>

      <div className="space-y-3">
        {items.map((edu) => (
          <div key={String(edu._id)} className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-100">{edu.degreeEn}</div>
              <div className="text-sm text-emerald-400">{edu.institutionEn}</div>
              {edu.fieldOfStudyEn && <div className="text-xs text-gray-400 mt-0.5">{edu.fieldOfStudyEn}</div>}
              {(edu.startDate || edu.endDate) && (
                <div className="text-xs text-gray-500 mt-1">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}</div>
              )}
            </div>
            <div className="flex gap-2 self-end shrink-0">
              <button onClick={() => openEdit(edu)} className="text-gray-400 hover:text-emerald-400"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => setDeleteId(String(edu._id))} className="text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center text-gray-500 py-12">No education entries yet.</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg my-8 shadow-2xl border border-gray-700">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h2 className="font-bold text-gray-100">{editing ? 'Edit Education' : 'Add Education'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
            </div>
            <div className="p-4 space-y-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Degree (EN) *" val={form.degreeEn} set={(v) => setForm({ ...form, degreeEn: v })} />
                <F label="Degree (AR)" val={form.degreeAr} set={(v) => setForm({ ...form, degreeAr: v })} dir="rtl" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Institution (EN) *" val={form.institutionEn} set={(v) => setForm({ ...form, institutionEn: v })} />
                <F label="Institution (AR)" val={form.institutionAr} set={(v) => setForm({ ...form, institutionAr: v })} dir="rtl" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Field of Study (EN)" val={form.fieldOfStudyEn} set={(v) => setForm({ ...form, fieldOfStudyEn: v })} />
                <F label="Field of Study (AR)" val={form.fieldOfStudyAr} set={(v) => setForm({ ...form, fieldOfStudyAr: v })} dir="rtl" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Start Date" val={form.startDate} set={(v) => setForm({ ...form, startDate: v })} placeholder="2024" />
                <F label="End Date" val={form.endDate} set={(v) => setForm({ ...form, endDate: v })} placeholder="2025 or Present" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Grade / GPA" val={form.grade} set={(v) => setForm({ ...form, grade: v })} />
                <F label="Logo URL" val={form.logo} set={(v) => setForm({ ...form, logo: v })} />
              </div>
              <T label="Description (EN)" val={form.descriptionEn} set={(v) => setForm({ ...form, descriptionEn: v })} rows={3} />
              <T label="Description (AR)" val={form.descriptionAr} set={(v) => setForm({ ...form, descriptionAr: v })} rows={3} dir="rtl" />
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
                <CheckF label="Visible" checked={form.visible} set={(v) => setForm({ ...form, visible: v })} />
                <div className="w-full sm:ml-auto sm:w-24">
                  <F label="Order" val={String(form.order)} set={(v) => setForm({ ...form, order: Number(v) })} type="number" />
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse justify-end gap-3 p-4 pt-0 sm:flex-row sm:p-5 sm:pt-0">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.degreeEn}
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
            <h3 className="font-bold text-gray-100 mb-2">Delete Education Entry?</h3>
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
