'use client';
import { useEffect, useState } from 'react';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchJson } from '@/lib/http';
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
  const [draggedId, setDraggedId] = useState<string | null>(null);

  async function load() {
    const data = await fetchJson<EducationData[]>('/api/education?admin=true');
    setItems(Array.isArray(data) ? data : []);
  }
  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, order: items.length });
    setModal(true);
  }

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
      await fetchJson<EducationData>(
        editing ? `/api/education/${editing._id}` : '/api/education',
        { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }
      );
      toast({ title: editing ? 'Updated!' : 'Added!', variant: 'success' });
      setModal(false);
      load();
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetchJson<{ success: boolean }>(`/api/education/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      toast({ title: 'Deleted' });
      load();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  }

  async function persistOrder(nextItems: EducationData[]) {
    try {
      const data = await fetchJson<{ success: boolean; education: EducationData[] }>(
        '/api/education/reorder',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: nextItems.map((e) => String(e._id)) }),
        }
      );
      setItems(data.education || nextItems);
      toast({ title: 'Order saved', variant: 'success' });
    } catch {
      toast({ title: 'Failed to save order', variant: 'destructive' });
      load();
    }
  }

  function moveDragged(overId: string) {
    if (!draggedId || draggedId === overId) return;
    setItems((current) => {
      const from = current.findIndex((e) => String(e._id) === draggedId);
      const to = current.findIndex((e) => String(e._id) === overId);
      if (from === -1 || to === -1) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((e, i) => ({ ...e, order: i }));
    });
  }

  return (
    <div className="max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Education</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {items.length} entr{items.length !== 1 ? 'ies' : 'y'} — drag to reorder
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Add Education
        </button>
      </div>

      <div className="space-y-3">
        {items.map((edu) => (
          <div
            key={String(edu._id)}
            draggable
            onDragStart={() => setDraggedId(String(edu._id))}
            onDragEnter={() => moveDragged(String(edu._id))}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={() => { persistOrder(items); setDraggedId(null); }}
            className={`flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-opacity${draggedId === String(edu._id) ? ' opacity-40' : ''}`}
          >
            <button
              className="mt-0.5 shrink-0 cursor-grab text-white/20 hover:text-white/50 active:cursor-grabbing"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground">{edu.degreeEn}</div>
              <div className="text-sm text-emerald-400">{edu.institutionEn}</div>
              {edu.fieldOfStudyEn && <div className="text-xs text-muted-foreground mt-0.5">{edu.fieldOfStudyEn}</div>}
              {(edu.startDate || edu.endDate) && (
                <div className="text-xs text-muted-foreground/70 mt-1">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}</div>
              )}
            </div>
            <div className="flex gap-2 self-start shrink-0">
              <button onClick={() => openEdit(edu)} className="text-muted-foreground hover:text-emerald-400 transition-colors"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => setDeleteId(String(edu._id))} className="text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center text-muted-foreground py-12">No education entries yet.</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#101310] rounded-xl w-full max-w-lg my-8 shadow-2xl border border-white/10">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{editing ? 'Edit Education' : 'Add Education'}</h2>
              <button onClick={() => setModal(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
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
              <div className="flex items-center gap-5">
                <CheckF label="Visible" checked={form.visible} set={(v) => setForm({ ...form, visible: v })} />
              </div>
            </div>
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/10 p-4 sm:flex-row sm:p-5">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.degreeEn || !form.institutionEn}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#101310] rounded-xl p-6 max-w-sm w-full border border-white/10">
            <h3 className="font-semibold text-foreground mb-2">Delete Education Entry?</h3>
            <p className="text-muted-foreground text-sm mb-5">This cannot be undone.</p>
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm transition-colors">Delete</button>
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
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input type={type} value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder} dir={dir}
        className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-foreground text-sm focus:outline-none focus:border-emerald-500/50" />
    </div>
  );
}
function T({ label, val, set, rows = 3, dir }: { label: string; val: string; set: (v: string) => void; rows?: number; dir?: string; }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <textarea rows={rows} value={val} onChange={(e) => set(e.target.value)} dir={dir}
        className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-foreground text-sm focus:outline-none focus:border-emerald-500/50 resize-none" />
    </div>
  );
}
function CheckF({ label, checked, set }: { label: string; checked: boolean; set: (v: boolean) => void; }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="h-4 w-4 rounded accent-emerald-500" />
      <span className="text-sm text-foreground/80">{label}</span>
    </label>
  );
}
