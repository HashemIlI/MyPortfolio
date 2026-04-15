'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Save, Loader2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import FileUploadField from '@/components/admin/FileUploadField';

type SectionSetting = {
  key: string;
  labelEn: string;
  labelAr: string;
  visible: boolean;
  order: number;
};

type SettingsData = Record<string, unknown> & {
  sections?: SectionSetting[];
};

type CredentialForm = {
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const EMPTY_CREDENTIALS: CredentialForm = {
  username: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function SettingsAdminPage() {
  const [data, setData] = useState<SettingsData>({});
  const [credentials, setCredentials] = useState<CredentialForm>(EMPTY_CREDENTIALS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, credentialsRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/auth/credentials'),
        ]);

        const settingsData = await settingsRes.json();
        const credentialData = await credentialsRes.json();

        setData(settingsData);
        setCredentials((current) => ({
          ...current,
          username: credentialData.username || '',
        }));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleSave = async (event?: FormEvent) => {
    event?.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Settings saved!', variant: 'success' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCredentialSave = async (event?: FormEvent) => {
    event?.preventDefault();

    if (!credentials.username || !credentials.currentPassword) {
      toast({ title: 'Username and current password are required', variant: 'destructive' });
      return;
    }

    if (credentials.newPassword && credentials.newPassword !== credentials.confirmPassword) {
      toast({ title: 'New password confirmation does not match', variant: 'destructive' });
      return;
    }

    setSavingCredentials(true);
    try {
      const res = await fetch('/api/auth/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          currentPassword: credentials.currentPassword,
          newPassword: credentials.newPassword,
        }),
      });

      const response = await res.json();
      if (!res.ok) throw new Error(response.error || 'Failed to update credentials');

      setCredentials({
        username: response.username || credentials.username,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({ title: 'Credentials updated!', variant: 'success' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Failed to update credentials',
        variant: 'destructive',
      });
    } finally {
      setSavingCredentials(false);
    }
  };

  const str = (key: string) => (data[key] as string) || '';
  const set = (key: string, value: unknown) => setData((prev) => ({ ...prev, [key]: value }));
  const nested = (parent: string, key: string) => {
    const obj = (data[parent] as Record<string, unknown>) || {};
    return (obj[key] as string) || '';
  };
  const setNested = (parent: string, key: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      [parent]: { ...(((prev[parent] as Record<string, unknown>) || {})), [key]: value },
    }));
  };

  const sections: SectionSetting[] = (data.sections as SectionSetting[]) || [];

  const toggleSection = (key: string) => {
    setData((prev) => ({
      ...prev,
      sections: ((prev.sections as SectionSetting[]) || []).map((section) =>
        section.key === key ? { ...section, visible: !section.visible } : section
      ),
    }));
  };

  const updateSectionLabel = (key: string, field: 'labelEn' | 'labelAr', value: string) => {
    setData((prev) => ({
      ...prev,
      sections: ((prev.sections as SectionSetting[]) || []).map((section) =>
        section.key === key ? { ...section, [field]: value } : section
      ),
    }));
  };

  const moveSection = (key: string, direction: 'up' | 'down') => {
    setData((prev) => {
      const ordered = [...((prev.sections as SectionSetting[]) || [])].sort(
        (a, b) => a.order - b.order
      );
      const index = ordered.findIndex((section) => section.key === key);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= ordered.length) return prev;

      const next = [...ordered];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return {
        ...prev,
        sections: next.map((section, itemIndex) => ({
          ...section,
          order: itemIndex + 1,
        })),
      };
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage global SEO, credentials, section visibility, and platform defaults.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Section title="Global SEO">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Site Title (EN)" val={str('siteTitleEn')} set={(value) => set('siteTitleEn', value)} />
            <Field label="Site Title (AR)" val={str('siteTitleAr')} set={(value) => set('siteTitleAr', value)} dir="rtl" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              label="Default Meta Title (EN)"
              val={str('defaultMetaTitleEn')}
              set={(value) => set('defaultMetaTitleEn', value)}
            />
            <Field
              label="Default Meta Title (AR)"
              val={str('defaultMetaTitleAr')}
              set={(value) => set('defaultMetaTitleAr', value)}
              dir="rtl"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Site Name (EN)" val={str('siteNameEn')} set={(value) => set('siteNameEn', value)} />
            <Field label="Site Name (AR)" val={str('siteNameAr')} set={(value) => set('siteNameAr', value)} dir="rtl" />
          </div>
          <Textarea
            label="Default Meta Description (EN)"
            val={str('defaultMetaDescriptionEn')}
            set={(value) => set('defaultMetaDescriptionEn', value)}
            rows={3}
          />
          <Textarea
            label="Default Meta Description (AR)"
            val={str('defaultMetaDescriptionAr')}
            set={(value) => set('defaultMetaDescriptionAr', value)}
            rows={3}
            dir="rtl"
          />
          <Field
            label="Default Keywords"
            val={((data.siteKeywords as string[]) || []).join(', ')}
            set={(value) => set('siteKeywords', value.split(',').map((item) => item.trim()).filter(Boolean))}
            placeholder="data analyst, ai, machine learning"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="OG Title (EN)" val={str('ogTitleEn')} set={(value) => set('ogTitleEn', value)} />
            <Field label="OG Title (AR)" val={str('ogTitleAr')} set={(value) => set('ogTitleAr', value)} dir="rtl" />
          </div>
          <Textarea
            label="OG Description (EN)"
            val={str('ogDescriptionEn')}
            set={(value) => set('ogDescriptionEn', value)}
            rows={2}
          />
          <Textarea
            label="OG Description (AR)"
            val={str('ogDescriptionAr')}
            set={(value) => set('ogDescriptionAr', value)}
            rows={2}
            dir="rtl"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FileUploadField
              label="OG Image"
              value={str('ogImage')}
              onChange={(value) => set('ogImage', value)}
              accept="image/*"
              subdir="general"
              placeholder="https://... or upload an image"
            />
            <FileUploadField
              label="Favicon"
              value={str('favicon')}
              onChange={(value) => set('favicon', value)}
              accept="image/*"
              subdir="general"
              placeholder="/favicon.ico or upload an icon"
            />
          </div>
        </Section>

        <Section title="Homepage Sections">
          <p className="-mt-1 text-xs text-muted-foreground">
            Control which sections appear on the homepage, their order, and the matching navbar order.
          </p>
          <div className="space-y-2">
            {sections.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No sections configured yet.</p>
            ) : (
              [...sections].sort((a, b) => a.order - b.order).map((section, index, ordered) => (
                <div
                  key={section.key}
                  className={`flex flex-col gap-3 rounded-xl border p-3 transition-colors md:flex-row md:items-center ${
                    section.visible
                      ? 'border-border/80 bg-background/30'
                      : 'border-border/60 bg-background/10 opacity-70'
                  }`}
                >
                  <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                      value={section.labelEn}
                      onChange={(e) => updateSectionLabel(section.key, 'labelEn', e.target.value)}
                      className="admin-control rounded-xl px-3 py-2 text-xs"
                      placeholder="Label (EN)"
                    />
                    <input
                      value={section.labelAr}
                      onChange={(e) => updateSectionLabel(section.key, 'labelAr', e.target.value)}
                      className="admin-control rounded-xl px-3 py-2 text-xs"
                      placeholder="Label (AR)"
                      dir="rtl"
                    />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground md:w-24">{section.key}</span>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                      section.visible
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-border/70 bg-background/30 text-muted-foreground'
                    }`}
                    title={section.visible ? 'Hide section' : 'Show section'}
                  >
                    {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveSection(section.key, 'up')}
                      disabled={index === 0}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/30 text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      title="Move section up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(section.key, 'down')}
                      disabled={index === ordered.length - 1}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/30 text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      title="Move section down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section title="Theme Defaults">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SelectField
              label="Default Theme"
              value={str('defaultTheme')}
              onChange={(value) => set('defaultTheme', value)}
              options={[
                { label: 'Dark', value: 'dark' },
                { label: 'Light', value: 'light' },
              ]}
            />
            <SelectField
              label="Default Language"
              value={str('defaultLanguage')}
              onChange={(value) => set('defaultLanguage', value)}
              options={[
                { label: 'English', value: 'en' },
                { label: 'Arabic', value: 'ar' },
              ]}
            />
          </div>
        </Section>

        <Section title="Analytics">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={Boolean(nested('analytics', 'enabled'))}
              onChange={(e) => setNested('analytics', 'enabled', e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500"
            />
            <span className="text-sm text-foreground">Enable Google Analytics</span>
          </label>
          <Field
            label="Google Analytics Measurement ID"
            val={nested('analytics', 'googleAnalyticsId')}
            set={(value) => setNested('analytics', 'googleAnalyticsId', value)}
            placeholder="G-XXXXXXXXXX"
          />
        </Section>

        <Section title="Footer">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Footer Text (EN)" val={str('footerTextEn')} set={(value) => set('footerTextEn', value)} />
            <Field label="Footer Text (AR)" val={str('footerTextAr')} set={(value) => set('footerTextAr', value)} dir="rtl" />
          </div>
        </Section>

        <Section title="Maintenance">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={Boolean(data.maintenanceMode)}
              onChange={(e) => set('maintenanceMode', e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500"
            />
            <span className="text-sm text-foreground">Enable Maintenance Mode</span>
          </label>
          <p className="text-xs text-muted-foreground">
            When enabled, visitors will see a maintenance page instead of the public portfolio.
          </p>
        </Section>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="admin-primary-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Site Settings
          </button>
        </div>
      </form>

      <div className="mt-6">
        <Section title="Admin Credentials">
          <form onSubmit={handleCredentialSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="Username"
                val={credentials.username}
                set={(value) => setCredentials((prev) => ({ ...prev, username: value }))}
              />
              <Field
                label="Current Password"
                val={credentials.currentPassword}
                set={(value) => setCredentials((prev) => ({ ...prev, currentPassword: value }))}
                type="password"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="New Password"
                val={credentials.newPassword}
                set={(value) => setCredentials((prev) => ({ ...prev, newPassword: value }))}
                type="password"
                placeholder="Leave blank to keep current password"
              />
              <Field
                label="Confirm New Password"
                val={credentials.confirmPassword}
                set={(value) => setCredentials((prev) => ({ ...prev, confirmPassword: value }))}
                type="password"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingCredentials}
                className="admin-primary-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {savingCredentials ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Credentials
              </button>
            </div>
          </form>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-surface rounded-2xl p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  val,
  set,
  type = 'text',
  placeholder = '',
  dir,
}: {
  label: string;
  val: string;
  set: (value: string) => void;
  type?: string;
  placeholder?: string;
  dir?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={val}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="admin-control w-full rounded-xl px-3 py-2 text-sm placeholder:text-muted-foreground/60"
      />
    </div>
  );
}

function Textarea({
  label,
  val,
  set,
  rows = 3,
  dir,
}: {
  label: string;
  val: string;
  set: (value: string) => void;
  rows?: number;
  dir?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <textarea
        rows={rows}
        value={val}
        onChange={(e) => set(e.target.value)}
        dir={dir}
        className="admin-control w-full resize-none rounded-xl px-3 py-2 text-sm"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-control w-full rounded-xl px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
