'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, Loader2, Paintbrush, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type {
  CardStylePreset,
  ColorThemePreset,
  RadiusPreset,
  SectionSpacingPreset,
  ThemeSettingsData,
  TypographyPreset,
} from '@/types/theme';

const DEFAULT_THEME: ThemeSettingsData = {
  colorTheme: 'default',
  radius: 'soft',
  cardStyle: 'premium',
  typographyScale: 'balanced',
  sectionSpacing: 'normal',
};

const COLOR_OPTIONS: Array<{
  label: string;
  value: ColorThemePreset;
  description: string;
  swatches: string[];
}> = [
  {
    label: 'Default',
    value: 'default',
    description: 'Original premium dark palette.',
    swatches: ['#4f9f70', '#0d0f12', '#171a20', '#a7afb9'],
  },
  {
    label: 'Emerald Pro',
    value: 'emerald-pro',
    description: 'Deeper green with cleaner contrast.',
    swatches: ['#38a86f', '#0b0d10', '#141820', '#9fa8b5'],
  },
  {
    label: 'Blue Tech',
    value: 'blue-tech',
    description: 'Modern SaaS blue accent on a cool dark base.',
    swatches: ['#5796e6', '#0a0d12', '#141923', '#9faabd'],
  },
  {
    label: 'Purple AI',
    value: 'purple-ai',
    description: 'Polished purple accent for AI-focused branding.',
    swatches: ['#a573ee', '#0a0c12', '#151925', '#a5adbc'],
  },
  {
    label: 'Cyan Data',
    value: 'cyan-data',
    description: 'Cyan-teal accent with a data product feel.',
    swatches: ['#27c7d0', '#0a0e13', '#151a22', '#9fa9b8'],
  },
  {
    label: 'Amber Minimal',
    value: 'amber-minimal',
    description: 'Warm amber accent, restrained and soft.',
    swatches: ['#e3a333', '#0b0d10', '#17191f', '#a5abb5'],
  },
  {
    label: 'Monochrome',
    value: 'monochrome',
    description: 'Subtle grayscale contrast with no strong accent.',
    swatches: ['#c3c8ce', '#0b0c0e', '#15171a', '#9da3aa'],
  },
  {
    label: 'Neon Dark',
    value: 'neon-dark',
    description: 'Subtle neon green glow without aggressive saturation.',
    swatches: ['#20e0a0', '#080b10', '#111722', '#9ea8b8'],
  },
];

const COLOR_LABELS = Object.fromEntries(
  COLOR_OPTIONS.map((option) => [option.value, option.label])
) as Record<ColorThemePreset, string>;

const RADIUS_OPTIONS: Array<{ label: string; value: RadiusPreset; description: string }> = [
  { label: 'Soft', value: 'soft', description: 'Original balanced radius.' },
  { label: 'Rounded', value: 'rounded', description: 'Softer corners without changing layout rhythm.' },
  { label: 'Sharp', value: 'sharp', description: 'Cleaner, tighter corners for a more technical look.' },
];

const CARD_OPTIONS: Array<{ label: string; value: CardStylePreset; description: string }> = [
  { label: 'Premium', value: 'premium', description: 'Original subtle glass surface and border.' },
  { label: 'Glass', value: 'glass', description: 'Slightly more translucent and luminous.' },
  { label: 'Minimal', value: 'minimal', description: 'Reduced surface treatment with clean borders.' },
];

const TYPOGRAPHY_OPTIONS: Array<{ label: string; value: TypographyPreset; description: string }> = [
  { label: 'Compact', value: 'compact', description: 'Slightly tighter text rhythm.' },
  { label: 'Balanced', value: 'balanced', description: 'Original visual hierarchy.' },
  { label: 'Large', value: 'large', description: 'A modest scale-up for larger displays.' },
];

const SPACING_OPTIONS: Array<{ label: string; value: SectionSpacingPreset; description: string }> = [
  { label: 'Tight', value: 'tight', description: 'Reduced vertical spacing.' },
  { label: 'Normal', value: 'normal', description: 'Original section spacing.' },
  { label: 'Relaxed', value: 'relaxed', description: 'More breathing room between sections.' },
];

export default function ThemeBrandingPage() {
  const [theme, setTheme] = useState<ThemeSettingsData>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const res = await fetch('/api/theme-settings');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTheme({ ...DEFAULT_THEME, ...data });
      } catch {
        toast({ title: 'Failed to load theme settings', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }

    loadTheme();
  }, []);

  const set = <K extends keyof ThemeSettingsData>(key: K, value: ThemeSettingsData[K]) => {
    setTheme((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async (event?: FormEvent) => {
    event?.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/theme-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setTheme({ ...DEFAULT_THEME, ...saved });
      toast({ title: 'Theme settings saved!', variant: 'success' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Theme & Branding</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose controlled presets that preserve the original premium dark design.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
        <div className="space-y-6">
          <Section title="Color Theme">
            <PresetGrid
              options={COLOR_OPTIONS}
              value={theme.colorTheme}
              onChange={(value) => set('colorTheme', value as ColorThemePreset)}
              renderExtra={(option) => (
                <div className="mt-3 flex gap-1.5">
                  {option.swatches?.map((swatch) => (
                      <span
                        key={swatch}
                        className="h-5 w-5 rounded-full border border-white/10"
                        style={{ background: swatch }}
                      />
                    ))}
                </div>
              )}
            />
          </Section>

          <Section title="Shape & Surfaces">
            <PresetGrid
              options={RADIUS_OPTIONS}
              value={theme.radius}
              onChange={(value) => set('radius', value as RadiusPreset)}
            />
            <div className="mt-4">
              <PresetGrid
                options={CARD_OPTIONS}
                value={theme.cardStyle}
                onChange={(value) => set('cardStyle', value as CardStylePreset)}
              />
            </div>
          </Section>

          <Section title="Rhythm">
            <PresetGrid
              options={TYPOGRAPHY_OPTIONS}
              value={theme.typographyScale}
              onChange={(value) => set('typographyScale', value as TypographyPreset)}
            />
            <div className="mt-4">
              <PresetGrid
                options={SPACING_OPTIONS}
                value={theme.sectionSpacing}
                onChange={(value) => set('sectionSpacing', value as SectionSpacingPreset)}
              />
            </div>
          </Section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="admin-primary-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Presets
            </button>
          </div>
        </div>

        <aside className="admin-surface h-fit rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Preset Preview</h2>
          </div>

          <div
            className="glass rounded-2xl p-5"
            data-card-style={theme.cardStyle}
            data-radius-style={theme.radius}
            data-typography-scale={theme.typographyScale}
            data-section-spacing={theme.sectionSpacing}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {COLOR_LABELS[theme.colorTheme]}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                Premium System
              </p>
              <h3 className="text-2xl font-semibold leading-tight">
                Controlled branding presets
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Presets adjust the site without allowing arbitrary values that can break contrast, spacing, or hierarchy.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Primary Action
              </button>
              <button type="button" className="rounded-lg border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground">
                Secondary
              </button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

type PresetOption = {
  label: string;
  value: string;
  description: string;
  swatches?: string[];
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-surface rounded-2xl p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function PresetGrid({
  options,
  value,
  onChange,
  renderExtra,
}: {
  options: PresetOption[];
  value: string;
  onChange: (value: string) => void;
  renderExtra?: (option: PresetOption) => React.ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-[7rem] rounded-2xl border p-4 text-left transition-all ${
              active
                ? 'border-primary/35 bg-primary/10 text-foreground shadow-sm shadow-primary/10'
                : 'border-white/10 bg-white/[0.025] text-muted-foreground hover:border-primary/20 hover:bg-white/[0.04] hover:text-foreground'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{option.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
              </div>
              {active && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            {renderExtra?.(option)}
          </button>
        );
      })}
    </div>
  );
}
