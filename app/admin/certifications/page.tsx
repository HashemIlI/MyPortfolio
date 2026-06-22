'use client';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchJson } from '@/lib/http';
import type { CertificationData } from '@/types/content';

type FormData = {
  nameEn: string; nameAr: string; issuer: string; date: string;
  descriptionEn: string; descriptionAr: string;
  credentialUrl: string; badge: string;
  featured: boolean; visible: boolean; order: number;
};

const EMPTY: FormData = {
  nameEn: '', nameAr: '', issuer: '', date: '',
  descriptionEn: '', descriptionAr: '',
  credentialUrl: '', badge: '',
  featured: false, visible: true, order: 0,
};

const LEGACY_MONTH_MAP: Record<string, string> = {
  Jan: '01', January: '01', Feb: '02', February: '02', Mar: '03', March: '03',
  Apr: '04', April: '04', May: '05', Jun: '06', June: '06', Jul: '07', July: '07',
  Aug: '08', August: '08', Sep: '09', September: '09', Oct: '10', October: '10',
  Nov: '11', November: '11', Dec: '12', December: '12',
};

const MONTH_TO_NUM: Record<string, number> = {
  Jan: 0, January: 0, Feb: 1, February: 1, Mar: 2, March: 2,
  Apr: 3, April: 3, May: 4, Jun: 5, June: 5, Jul: 6, July: 6,
  Aug: 7, August: 7, Sep: 8, September: 8, Oct: 9, October: 9,
  Nov: 10, November: 10, Dec: 11, December: 11,
};

function parseCertDate(dateStr: string): number {
  if (!dateStr) return 0;
  const yyyyMm = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (yyyyMm) return new Date(parseInt(yyyyMm[1], 10), parseInt(yyyyMm[2], 10) - 1, 1).getTime();
  const monthYear = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const month = MONTH_TO_NUM[monthYear[1]];
    const year = parseInt(monthYear[2], 10);
    if (month !== undefined && !isNaN(year)) return new Date(year, month, 1).getTime();
  }
  const yearOnly = dateStr.match(/^(\d{4})$/);
  if (yearOnly) return new Date(parseInt(yearOnly[1], 10), 0, 1).getTime();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function toMonthInputValue(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}$/.test(dateStr)) return dateStr;
  const m = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m && LEGACY_MONTH_MAP[m[1]]) return `${m[2]}-${LEGACY_MONTH_MAP[m[1]]}`;
  return '';
}

function formatCertDate(dateStr: string): string {
  if (!dateStr) return '';
  const m = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (!m) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[parseInt(m[2], 10) - 1];
  return month ? `${month} ${m[1]}` : dateStr;
}

export default function CertificationsAdminPage() {
  const [certs, setCerts] = useState<CertificationData[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CertificationData | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  async function load() {
    const data = await fetchJson<CertificationData[]>('/api/certifications?admin=true');
    setCerts(Array.isArray(data) ? data : []);
  }
  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, order: certs.length });
    setModal(true);
  }

  function openEdit(c: CertificationData) {
    setEditing(c);
    setForm({
      nameEn: c.nameEn, nameAr: c.nameAr || '', issuer: c.issuer,
      date: toMonthInputValue(c.date || ''),
      descriptionEn: c.descriptionEn || '', descriptionAr: c.descriptionAr || '',
      credentialUrl: c.credentialUrl || '', badge: c.badge || '',
      featured: c.featured, visible: c.visible, order: c.order,
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.nameEn || !form.issuer) return;
    setSaving(true);
    try {
      await fetchJson<CertificationData>(
        editing ? `/api/certifications/${editing._id}` : '/api/certifications',
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
      await fetchJson<{ success: boolean }>(`/api/certifications/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      toast({ title: 'Deleted' });
      load();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  }

  async function persistOrder(nextCerts: CertificationData[]) {
    try {
      const data = await fetchJson<{ success: boolean; certs: CertificationData[] }>(
        '/api/certifications/reorder',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: nextCerts.map((c) => String(c._id)) }),
        }
      );
      setCerts(data.certs || nextCerts);
      toast({ title: 'Order saved', variant: 'success' });
    } catch {
      toast({ title: 'Failed to save order', variant: 'destructive' });
      load();
    }
  }

  function moveDragged(overId: string) {
    if (!draggedId || draggedId === overId) return;
    setCerts((current) => {
      const from = current.findIndex((c) => String(c._id) === draggedId);
      const to = current.findIndex((c) => String(c._id) === overId);
      if (from === -1 || to === -1) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((c, i) => ({ ...c, order: i }));
    });
  }

  function handleDateSort(dir: 'asc' | 'desc') {
    const sorted = [...certs].sort((a, b) => {
      const diff = parseCertDate(a.date) - parseCertDate(b.date);
      return dir === 'asc' ? diff : -diff;
    });
    setCerts(sorted);
    persistOrder(sorted);
  }

  return (
    <div className="max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Certifications</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {certs.length} certification{certs.length !== 1 ? 's' : ''} — drag rows to reorder
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by date:</span>
          <button
            onClick={() => handleDateSort('desc')}
            title="Newest first — sorts and saves"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:border-primary/30 hover:text-primary"
          >
            <ArrowDown className="h-3.5 w-3.5" /> Newest
          </button>
          <button
            onClick={() => handleDateSort('asc')}
            title="Oldest first — sorts and saves"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:border-primary/30 hover:text-primary"
          >
            <ArrowUp className="h-3.5 w-3.5" /> Oldest
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" /> Add Certification
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        {certs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No certifications yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="w-8 px-3 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">Issuer</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Featured</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {certs.map((c) => (
                  <tr
                    key={String(c._id)}
                    draggable
                    onDragStart={() => setDraggedId(String(c._id))}
                    onDragEnter={() => moveDragged(String(c._id))}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnd={() => {
                      const ordered = certs.map((item, i) => ({ ...item, order: i }));
                      setDraggedId(null);
                      persistOrder(ordered);
                    }}
                    className={`transition-colors hover:bg-white/[0.025] ${
                      draggedId === String(c._id) ? 'opacity-40' : ''
                    }`}
                  >
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="cursor-grab rounded p-1 text-gray-600 transition-colors hover:text-gray-400 active:cursor-grabbing"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px] truncate font-medium text-gray-100">{c.nameEn}</div>
                      {c.nameAr && <div className="text-xs text-gray-500">{c.nameAr}</div>}
                      {!c.visible && <span className="text-[10px] text-amber-500/80">Hidden</span>}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-xs text-gray-400">{c.issuer}</span>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="text-xs text-gray-500">{formatCertDate(c.date)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.featured && <Star className="mx-auto h-3.5 w-3.5 fill-current text-amber-400" />}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(c)} className="mr-3 text-gray-400 transition-colors hover:text-emerald-400">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(String(c._id))} className="text-gray-400 transition-colors hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-4 w-full max-w-lg rounded-xl border border-white/10 bg-[#101310] shadow-2xl sm:my-8">
            <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-5">
              <h2 className="text-base font-bold text-gray-100">
                {editing ? 'Edit Certification' : 'Add Certification'}
              </h2>
              <button onClick={() => setModal(false)} className="text-xl leading-none text-gray-500 transition-colors hover:text-gray-300">×</button>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Name (EN) *" val={form.nameEn} set={(v) => setForm({ ...form, nameEn: v })} />
                <F label="Name (AR)" val={form.nameAr} set={(v) => setForm({ ...form, nameAr: v })} dir="rtl" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Issuer *" val={form.issuer} set={(v) => setForm({ ...form, issuer: v })} />
                <F label="Date" val={form.date} set={(v) => setForm({ ...form, date: v })} type="month" />
              </div>
              <T label="Description (EN)" val={form.descriptionEn} set={(v) => setForm({ ...form, descriptionEn: v })} rows={2} />
              <T label="Description (AR)" val={form.descriptionAr} set={(v) => setForm({ ...form, descriptionAr: v })} rows={2} dir="rtl" />
              <F label="Credential URL" val={form.credentialUrl} set={(v) => setForm({ ...form, credentialUrl: v })} placeholder="https://..." />
              <F label="Badge Image URL" val={form.badge} set={(v) => setForm({ ...form, badge: v })} />
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
                <CheckF label="Featured" checked={form.featured} set={(v) => setForm({ ...form, featured: v })} />
                <CheckF label="Visible" checked={form.visible} set={(v) => setForm({ ...form, visible: v })} />
                <div className="w-full sm:ml-auto sm:w-24">
                  <F label="Order" val={String(form.order)} set={(v) => setForm({ ...form, order: Number(v) })} type="number" />
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/10 p-4 sm:flex-row sm:p-5">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400 transition-colors hover:text-gray-200">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.nameEn || !form.issuer}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#101310] p-6 shadow-2xl">
            <h3 className="mb-2 font-bold text-gray-100">Delete Certification?</h3>
            <p className="mb-5 text-sm text-gray-400">This cannot be undone.</p>
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-400 transition-colors hover:text-gray-200">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
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
      <label className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      <input
        type={type} value={val} onChange={(e) => set(e.target.value)}
        placeholder={placeholder} dir={dir}
        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}

function T({ label, val, set, rows = 3, dir }: {
  label: string; val: string; set: (v: string) => void; rows?: number; dir?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      <textarea
        rows={rows} value={val} onChange={(e) => set(e.target.value)} dir={dir}
        className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}

function CheckF({ label, checked, set }: { label: string; checked: boolean; set: (v: boolean) => void; }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="h-4 w-4 rounded accent-emerald-500" />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
}
