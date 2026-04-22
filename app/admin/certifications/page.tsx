'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

export default function CertificationsAdminPage() {
  const [certs, setCerts] = useState<CertificationData[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CertificationData | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    const data = await fetch('/api/certifications?admin=true').then((r) => r.json());
    setCerts(Array.isArray(data) ? data : []);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(c: CertificationData) {
    setEditing(c);
    setForm({
      nameEn: c.nameEn, nameAr: c.nameAr || '', issuer: c.issuer, date: c.date || '',
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
      const res = await fetch(
        editing ? `/api/certifications/${editing._id}` : '/api/certifications',
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
    await fetch(`/api/certifications/${id}`, { method: 'DELETE' });
    setDeleteId(null); toast({ title: 'Deleted' }); load();
  }

  return (
    <div className="max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Certifications</h1>
          <p className="text-gray-400 text-sm mt-0.5">{certs.length} cert{certs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Add Certification
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {certs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No certifications yet.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-gray-700/50 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Name</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium hidden md:table-cell">Issuer</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Featured</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {certs.map((c) => (
                <tr key={String(c._id)} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-100 truncate max-w-[200px]">{c.nameEn}</div>
                    {c.nameAr && <div className="text-xs text-gray-500">{c.nameAr}</div>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-400">{c.issuer}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-gray-500">{c.date}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.featured && <Star className="h-3.5 w-3.5 text-amber-400 fill-current mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-emerald-400 mr-3"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(String(c._id))} className="text-gray-400 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg my-8 shadow-2xl border border-gray-700">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h2 className="font-bold text-gray-100">{editing ? 'Edit Certification' : 'Add Certification'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
            </div>
            <div className="p-4 space-y-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Name (EN) *" val={form.nameEn} set={(v) => setForm({ ...form, nameEn: v })} />
                <F label="Name (AR)" val={form.nameAr} set={(v) => setForm({ ...form, nameAr: v })} dir="rtl" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="Issuer *" val={form.issuer} set={(v) => setForm({ ...form, issuer: v })} />
                <F label="Date" val={form.date} set={(v) => setForm({ ...form, date: v })} placeholder="Feb 2025" />
              </div>
              <T label="Description (EN)" val={form.descriptionEn} set={(v) => setForm({ ...form, descriptionEn: v })} rows={2} />
              <T label="Description (AR)" val={form.descriptionAr} set={(v) => setForm({ ...form, descriptionAr: v })} rows={2} dir="rtl" />
              <F label="Credential URL" val={form.credentialUrl} set={(v) => setForm({ ...form, credentialUrl: v })} placeholder="https://coursera.org/..." />
              <F label="Badge Image URL" val={form.badge} set={(v) => setForm({ ...form, badge: v })} />
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
                <CheckF label="Featured" checked={form.featured} set={(v) => setForm({ ...form, featured: v })} />
                <CheckF label="Visible" checked={form.visible} set={(v) => setForm({ ...form, visible: v })} />
                <div className="w-full sm:ml-auto sm:w-24">
                  <F label="Order" val={String(form.order)} set={(v) => setForm({ ...form, order: Number(v) })} type="number" />
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse justify-end gap-3 p-4 pt-0 sm:flex-row sm:p-5 sm:pt-0">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.nameEn}
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
            <h3 className="font-bold text-gray-100 mb-2">Delete Certification?</h3>
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
