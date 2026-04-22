'use client';
import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import FileUploadField from '@/components/admin/FileUploadField';

type ProfileData = Record<string, string | boolean>;

const TABS = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  { id: 'social', label: 'Social Links' },
];

export default function ProfileAdminPage() {
  const [activeTab, setActiveTab] = useState('hero');
  const [data, setData] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Profile saved!', variant: 'success' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, val: string | boolean) => setData((d) => ({ ...d, [key]: val }));
  const str = (key: string) => (data[key] as string) || '';
  const bool = (key: string) => Boolean(data[key]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Profile</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage hero, about, contact & social links</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-full flex-wrap gap-1 rounded-lg bg-gray-800 p-1 sm:w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-5">
        {activeTab === 'hero' && (
          <>
            <BilField label="Name" enKey="nameEn" arKey="nameAr" str={str} set={set} />
            <BilField label="Hero Headline" enKey="headlineEn" arKey="headlineAr" str={str} set={set} />
            <BilField label="Title / Role" enKey="titleEn" arKey="titleAr" str={str} set={set} />
            <BilField label="Subtitle" enKey="subtitleEn" arKey="subtitleAr" str={str} set={set} />
            <BilField label="CTA – Hire Me" enKey="ctaHireMeEn" arKey="ctaHireMeAr" str={str} set={set} />
            <BilField label="CTA – Download CV" enKey="ctaDownloadCvEn" arKey="ctaDownloadCvAr" str={str} set={set} />
            <FileUploadField
              label="Profile Image"
              value={str('profileImage')}
              onChange={(v) => set('profileImage', v)}
              accept="image/*"
              subdir="profile"
              placeholder="/uploads/profile/photo.jpg"
            />
            <FileUploadField
              label="CV / Resume (PDF)"
              value={str('cvFile')}
              onChange={(v) => set('cvFile', v)}
              accept=".pdf,application/pdf"
              subdir="profile"
              placeholder="/uploads/profile/cv.pdf"
            />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="availableForWork"
                checked={bool('availableForWork')}
                onChange={(e) => set('availableForWork', e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-500"
              />
              <label htmlFor="availableForWork" className="text-sm text-gray-300">Available for Work</label>
            </div>
            <BilField label="Availability Label" enKey="availabilityLabelEn" arKey="availabilityLabelAr" str={str} set={set} />
          </>
        )}

        {activeTab === 'about' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Summary (EN)</label>
              <textarea
                rows={4}
                value={str('summaryEn')}
                onChange={(e) => set('summaryEn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Summary (AR)</label>
              <textarea
                rows={4}
                dir="rtl"
                value={str('summaryAr')}
                onChange={(e) => set('summaryAr', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">About (EN)</label>
              <textarea
                rows={6}
                value={str('aboutEn')}
                onChange={(e) => set('aboutEn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">About (AR)</label>
              <textarea
                rows={6}
                dir="rtl"
                value={str('aboutAr')}
                onChange={(e) => set('aboutAr', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <FileUploadField
              label="About Section Image"
              value={str('aboutImage')}
              onChange={(v) => set('aboutImage', v)}
              accept="image/*"
              subdir="profile"
            />
          </>
        )}

        {activeTab === 'contact' && (
          <>
            <Field label="Email" fieldKey="email" str={str} set={set} type="email" />
            <Field label="Phone" fieldKey="phone" str={str} set={set} type="tel" />
            <BilField label="Location" enKey="locationEn" arKey="locationAr" str={str} set={set} />
          </>
        )}

        {activeTab === 'social' && (
          <>
            <Field label="GitHub URL" fieldKey="github" str={str} set={set} placeholder="https://github.com/..." />
            <Field label="LinkedIn URL" fieldKey="linkedin" str={str} set={set} placeholder="https://linkedin.com/in/..." />
            <Field label="Kaggle URL" fieldKey="kaggle" str={str} set={set} placeholder="https://kaggle.com/..." />
            <Field label="WhatsApp URL" fieldKey="whatsapp" str={str} set={set} placeholder="https://wa.me/..." />
            <Field label="Twitter/X URL" fieldKey="twitter" str={str} set={set} placeholder="https://twitter.com/..." />
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, fieldKey, str, set, type = 'text', placeholder = '' }: {
  label: string; fieldKey: string; str: (k: string) => string;
  set: (k: string, v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={str(fieldKey)}
        onChange={(e) => set(fieldKey, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function BilField({ label, enKey, arKey, str, set }: {
  label: string; enKey: string; arKey: string;
  str: (k: string) => string; set: (k: string, v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">{label} (EN)</label>
        <input
          type="text"
          value={str(enKey)}
          onChange={(e) => set(enKey, e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">{label} (AR)</label>
        <input
          type="text"
          dir="rtl"
          value={str(arKey)}
          onChange={(e) => set(arKey, e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
}
