import 'server-only';

import type { CSSProperties } from 'react';
import connectDB from '@/lib/mongodb';
import ThemeSettings from '@/models/ThemeSettings';
import type {
  CardStylePreset,
  ColorThemePreset,
  RadiusPreset,
  SectionSpacingPreset,
  ThemeSettingsData,
  TypographyPreset,
} from '@/types/theme';

export const DEFAULT_THEME_SETTINGS: ThemeSettingsData = {
  colorTheme: 'default',
  radius: 'soft',
  cardStyle: 'premium',
  typographyScale: 'balanced',
  sectionSpacing: 'normal',
};

const THEME_SINGLETON_KEY = 'theme';

const VALID_COLOR_THEME = new Set<ColorThemePreset>([
  'default',
  'emerald-pro',
  'blue-tech',
  'purple-ai',
  'cyan-data',
  'amber-minimal',
  'monochrome',
  'neon-dark',
]);
const VALID_RADIUS = new Set<RadiusPreset>(['soft', 'rounded', 'sharp']);
const VALID_CARD_STYLE = new Set<CardStylePreset>(['premium', 'glass', 'minimal']);
const VALID_TYPOGRAPHY = new Set<TypographyPreset>(['compact', 'balanced', 'large']);
const VALID_SPACING = new Set<SectionSpacingPreset>(['tight', 'normal', 'relaxed']);

type ThemeCssProperties = CSSProperties & Record<`--${string}`, string>;

function serializeTheme(theme: unknown): ThemeSettingsData {
  return normalizeTheme(theme ? JSON.parse(JSON.stringify(theme)) : {});
}

function normalizeTheme(input: Record<string, unknown>): ThemeSettingsData {
  const next = sanitizeThemeInput(input);
  const hasPresetColorTheme =
    typeof input.colorTheme === 'string' && VALID_COLOR_THEME.has(input.colorTheme as ColorThemePreset);
  const hasLegacyRawColors =
    typeof input.primaryColor === 'string' || typeof input.secondaryColor === 'string';

  if (!hasPresetColorTheme && hasLegacyRawColors && input.cardStyle === 'glass') {
    next.cardStyle = 'premium';
  }

  return {
    ...DEFAULT_THEME_SETTINGS,
    ...next,
    _id: typeof input._id === 'string' ? input._id : undefined,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : undefined,
  };
}

export async function getThemeSettings(options: { createIfMissing?: boolean } = {}) {
  await connectDB();

  const existingTheme = await ThemeSettings.findOne({ singletonKey: THEME_SINGLETON_KEY }).lean();
  if (existingTheme || !options.createIfMissing) {
    return serializeTheme(existingTheme);
  }

  const theme = await ThemeSettings.create({
    ...DEFAULT_THEME_SETTINGS,
    singletonKey: THEME_SINGLETON_KEY,
  });
  return serializeTheme(theme.toObject());
}

export function sanitizeThemeInput(input: Record<string, unknown>): ThemeSettingsData {
  const next = { ...DEFAULT_THEME_SETTINGS };

  if (typeof input.colorTheme === 'string' && VALID_COLOR_THEME.has(input.colorTheme as ColorThemePreset)) {
    next.colorTheme = input.colorTheme as ColorThemePreset;
  }
  if (typeof input.radius === 'string' && VALID_RADIUS.has(input.radius as RadiusPreset)) {
    next.radius = input.radius as RadiusPreset;
  }
  if (typeof input.cardStyle === 'string' && VALID_CARD_STYLE.has(input.cardStyle as CardStylePreset)) {
    next.cardStyle = input.cardStyle as CardStylePreset;
  }
  if (
    typeof input.typographyScale === 'string' &&
    VALID_TYPOGRAPHY.has(input.typographyScale as TypographyPreset)
  ) {
    next.typographyScale = input.typographyScale as TypographyPreset;
  }
  if (
    typeof input.sectionSpacing === 'string' &&
    VALID_SPACING.has(input.sectionSpacing as SectionSpacingPreset)
  ) {
    next.sectionSpacing = input.sectionSpacing as SectionSpacingPreset;
  }

  return next;
}

export async function saveThemeSettings(input: Record<string, unknown>) {
  await connectDB();

  const update = sanitizeThemeInput(input);
  const theme = await ThemeSettings.findOneAndUpdate(
    { singletonKey: THEME_SINGLETON_KEY },
    { $set: update, $setOnInsert: { singletonKey: THEME_SINGLETON_KEY } },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return serializeTheme(theme);
}

export function buildThemeStyle(theme: ThemeSettingsData): ThemeCssProperties {
  const preset = COLOR_THEME_STYLES[theme.colorTheme];
  if (!preset) return {};

  return {
    ...prefixThemeTokens('light', preset.light),
    ...prefixThemeTokens('dark', preset.dark),
  };
}

type ModeThemeTokens = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  glassBg: string;
  glassBorder: string;
  bodyGradient: string;
};

type ColorPresetTokens = {
  light: ModeThemeTokens;
  dark: ModeThemeTokens;
};

function prefixThemeTokens(mode: 'light' | 'dark', tokens: ModeThemeTokens): ThemeCssProperties {
  return {
    [`--theme-${mode}-background`]: tokens.background,
    [`--theme-${mode}-foreground`]: tokens.foreground,
    [`--theme-${mode}-card`]: tokens.card,
    [`--theme-${mode}-card-foreground`]: tokens.cardForeground,
    [`--theme-${mode}-popover`]: tokens.popover,
    [`--theme-${mode}-popover-foreground`]: tokens.popoverForeground,
    [`--theme-${mode}-primary`]: tokens.primary,
    [`--theme-${mode}-primary-foreground`]: tokens.primaryForeground,
    [`--theme-${mode}-secondary`]: tokens.secondary,
    [`--theme-${mode}-secondary-foreground`]: tokens.secondaryForeground,
    [`--theme-${mode}-muted`]: tokens.muted,
    [`--theme-${mode}-muted-foreground`]: tokens.mutedForeground,
    [`--theme-${mode}-accent`]: tokens.accent,
    [`--theme-${mode}-accent-foreground`]: tokens.accentForeground,
    [`--theme-${mode}-border`]: tokens.border,
    [`--theme-${mode}-input`]: tokens.input,
    [`--theme-${mode}-ring`]: tokens.ring,
    [`--theme-${mode}-glass-bg`]: tokens.glassBg,
    [`--theme-${mode}-glass-border`]: tokens.glassBorder,
    [`--theme-${mode}-body-gradient`]: tokens.bodyGradient,
  };
}

const DEFAULT_LIGHT: ModeThemeTokens = {
  background: '0 0% 100%',
  foreground: '222 47% 11%',
  card: '0 0% 100%',
  cardForeground: '222 47% 11%',
  popover: '0 0% 100%',
  popoverForeground: '222 47% 11%',
  primary: '147 45% 34%',
  primaryForeground: '0 0% 100%',
  secondary: '210 40% 96%',
  secondaryForeground: '222 47% 11%',
  muted: '210 40% 96%',
  mutedForeground: '215 16% 47%',
  accent: '210 40% 96%',
  accentForeground: '222 47% 11%',
  border: '214 32% 91%',
  input: '214 32% 91%',
  ring: '147 45% 34%',
  glassBg: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  bodyGradient: 'radial-gradient(circle at top, rgba(34, 197, 94, 0.06), transparent 28%)',
};

const DEFAULT_DARK: ModeThemeTokens = {
  background: '220 13% 6%',
  foreground: '210 25% 96%',
  card: '220 12% 9%',
  cardForeground: '210 25% 96%',
  popover: '220 12% 8%',
  popoverForeground: '210 25% 96%',
  primary: '146 38% 44%',
  primaryForeground: '220 13% 8%',
  secondary: '220 10% 13%',
  secondaryForeground: '210 25% 96%',
  muted: '220 10% 13%',
  mutedForeground: '215 12% 66%',
  accent: '220 10% 13%',
  accentForeground: '210 25% 96%',
  border: '220 9% 18%',
  input: '220 9% 18%',
  ring: '146 38% 44%',
  glassBg: 'rgba(255, 255, 255, 0.025)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  bodyGradient: 'radial-gradient(circle at top, rgba(34, 197, 94, 0.06), transparent 28%)',
};

const COLOR_THEME_STYLES: Record<ColorThemePreset, ColorPresetTokens | null> = {
  default: null,
  'emerald-pro': {
    light: {
      ...DEFAULT_LIGHT,
      primary: '151 47% 34%',
      ring: '151 47% 34%',
      accent: '151 34% 94%',
      accentForeground: '151 50% 18%',
      mutedForeground: '215 14% 42%',
      glassBg: 'rgba(255, 255, 255, 0.62)',
      glassBorder: 'rgba(21, 128, 61, 0.14)',
      bodyGradient: 'radial-gradient(circle at top, rgba(21, 128, 61, 0.055), transparent 28%)',
    },
    dark: {
      ...DEFAULT_DARK,
      background: '220 14% 5%',
      card: '220 13% 8%',
      popover: '220 13% 7%',
      primary: '151 50% 44%',
      primaryForeground: '220 14% 6%',
      secondary: '220 11% 12%',
      muted: '220 11% 12%',
      mutedForeground: '214 12% 64%',
      accent: '151 28% 13%',
      accentForeground: '151 55% 82%',
      border: '220 9% 16%',
      input: '220 9% 16%',
      ring: '151 50% 44%',
      glassBg: 'rgba(255, 255, 255, 0.024)',
      glassBorder: 'rgba(77, 178, 123, 0.13)',
      bodyGradient: 'radial-gradient(circle at top, rgba(52, 211, 153, 0.055), transparent 28%)',
    },
  },
  'blue-tech': {
    light: {
      ...DEFAULT_LIGHT,
      primary: '213 72% 42%',
      ring: '213 72% 42%',
      accent: '213 70% 95%',
      accentForeground: '213 60% 22%',
      mutedForeground: '216 14% 42%',
      glassBg: 'rgba(255, 255, 255, 0.64)',
      glassBorder: 'rgba(37, 99, 235, 0.14)',
      bodyGradient: 'radial-gradient(circle at top, rgba(37, 99, 235, 0.055), transparent 28%)',
    },
    dark: {
      ...DEFAULT_DARK,
      background: '222 18% 5%',
      card: '222 16% 8%',
      popover: '222 16% 7%',
      primary: '213 72% 58%',
      primaryForeground: '220 20% 7%',
      secondary: '220 13% 12%',
      muted: '220 13% 12%',
      mutedForeground: '216 13% 65%',
      accent: '213 34% 14%',
      accentForeground: '213 75% 84%',
      border: '220 10% 17%',
      input: '220 10% 17%',
      ring: '213 72% 58%',
      glassBg: 'rgba(255, 255, 255, 0.024)',
      glassBorder: 'rgba(96, 165, 250, 0.13)',
      bodyGradient: 'radial-gradient(circle at top, rgba(59, 130, 246, 0.06), transparent 28%)',
    },
  },
  'purple-ai': {
    light: {
      ...DEFAULT_LIGHT,
      primary: '267 58% 48%',
      ring: '267 58% 48%',
      accent: '267 72% 96%',
      accentForeground: '267 50% 24%',
      mutedForeground: '218 13% 43%',
      glassBg: 'rgba(255, 255, 255, 0.64)',
      glassBorder: 'rgba(126, 34, 206, 0.14)',
      bodyGradient: 'radial-gradient(circle at top, rgba(126, 34, 206, 0.055), transparent 28%)',
    },
    dark: {
      ...DEFAULT_DARK,
      background: '224 16% 5%',
      card: '224 15% 8%',
      popover: '224 15% 7%',
      primary: '267 72% 66%',
      primaryForeground: '224 18% 7%',
      secondary: '226 12% 12%',
      muted: '226 12% 12%',
      mutedForeground: '218 12% 66%',
      accent: '267 32% 15%',
      accentForeground: '267 78% 86%',
      border: '226 10% 17%',
      input: '226 10% 17%',
      ring: '267 72% 66%',
      glassBg: 'rgba(255, 255, 255, 0.024)',
      glassBorder: 'rgba(168, 85, 247, 0.14)',
      bodyGradient: 'radial-gradient(circle at top, rgba(147, 51, 234, 0.06), transparent 28%)',
    },
  },
  'cyan-data': {
    light: {
      ...DEFAULT_LIGHT,
      primary: '184 78% 34%',
      ring: '184 78% 34%',
      accent: '184 70% 94%',
      accentForeground: '184 60% 19%',
      mutedForeground: '215 13% 42%',
      glassBg: 'rgba(255, 255, 255, 0.63)',
      glassBorder: 'rgba(8, 145, 178, 0.14)',
      bodyGradient: 'radial-gradient(circle at top, rgba(8, 145, 178, 0.055), transparent 28%)',
    },
    dark: {
      ...DEFAULT_DARK,
      background: '219 18% 5%',
      card: '219 16% 8%',
      popover: '219 16% 7%',
      primary: '184 68% 48%',
      primaryForeground: '220 16% 7%',
      secondary: '218 13% 12%',
      muted: '218 13% 12%',
      mutedForeground: '215 12% 65%',
      accent: '184 32% 13%',
      accentForeground: '184 72% 82%',
      border: '218 10% 17%',
      input: '218 10% 17%',
      ring: '184 68% 48%',
      glassBg: 'rgba(255, 255, 255, 0.024)',
      glassBorder: 'rgba(34, 211, 238, 0.13)',
      bodyGradient: 'radial-gradient(circle at top, rgba(6, 182, 212, 0.055), transparent 28%)',
    },
  },
  'amber-minimal': {
    light: {
      ...DEFAULT_LIGHT,
      primary: '35 78% 42%',
      ring: '35 78% 42%',
      accent: '38 75% 94%',
      accentForeground: '35 66% 20%',
      mutedForeground: '215 12% 42%',
      glassBg: 'rgba(255, 255, 255, 0.62)',
      glassBorder: 'rgba(217, 119, 6, 0.14)',
      bodyGradient: 'radial-gradient(circle at top, rgba(217, 119, 6, 0.045), transparent 28%)',
    },
    dark: {
      ...DEFAULT_DARK,
      background: '222 13% 5%',
      card: '222 12% 8%',
      popover: '222 12% 7%',
      primary: '37 75% 54%',
      primaryForeground: '30 20% 8%',
      secondary: '220 10% 12%',
      muted: '220 10% 12%',
      mutedForeground: '215 11% 65%',
      accent: '37 30% 13%',
      accentForeground: '37 72% 82%',
      border: '220 8% 17%',
      input: '220 8% 17%',
      ring: '37 75% 54%',
      glassBg: 'rgba(255, 255, 255, 0.023)',
      glassBorder: 'rgba(245, 158, 11, 0.12)',
      bodyGradient: 'radial-gradient(circle at top, rgba(245, 158, 11, 0.045), transparent 28%)',
    },
  },
  monochrome: {
    light: {
      ...DEFAULT_LIGHT,
      primary: '220 8% 31%',
      primaryForeground: '0 0% 100%',
      ring: '220 8% 31%',
      secondary: '220 14% 95%',
      muted: '220 14% 95%',
      accent: '220 14% 94%',
      accentForeground: '220 18% 17%',
      mutedForeground: '220 7% 42%',
      border: '220 13% 88%',
      input: '220 13% 88%',
      glassBg: 'rgba(255, 255, 255, 0.64)',
      glassBorder: 'rgba(15, 23, 42, 0.1)',
      bodyGradient: 'radial-gradient(circle at top, rgba(15, 23, 42, 0.035), transparent 28%)',
    },
    dark: {
      ...DEFAULT_DARK,
      background: '220 10% 5%',
      card: '220 9% 8%',
      popover: '220 9% 7%',
      primary: '210 12% 78%',
      primaryForeground: '220 10% 7%',
      secondary: '220 8% 12%',
      secondaryForeground: '210 20% 94%',
      muted: '220 8% 12%',
      mutedForeground: '215 8% 64%',
      accent: '220 7% 14%',
      accentForeground: '210 16% 92%',
      border: '220 7% 17%',
      input: '220 7% 17%',
      ring: '210 12% 78%',
      glassBg: 'rgba(255, 255, 255, 0.022)',
      glassBorder: 'rgba(255, 255, 255, 0.075)',
      bodyGradient: 'radial-gradient(circle at top, rgba(255, 255, 255, 0.028), transparent 28%)',
    },
  },
  'neon-dark': {
    light: {
      ...DEFAULT_LIGHT,
      primary: '158 72% 34%',
      ring: '158 72% 34%',
      accent: '158 72% 94%',
      accentForeground: '158 62% 18%',
      mutedForeground: '215 14% 42%',
      glassBg: 'rgba(255, 255, 255, 0.62)',
      glassBorder: 'rgba(5, 150, 105, 0.14)',
      bodyGradient: 'radial-gradient(circle at top, rgba(5, 150, 105, 0.06), transparent 28%)',
    },
    dark: {
      ...DEFAULT_DARK,
      background: '222 18% 4%',
      card: '222 16% 7%',
      popover: '222 16% 6%',
      primary: '159 84% 52%',
      primaryForeground: '222 18% 5%',
      secondary: '222 13% 11%',
      muted: '222 13% 11%',
      mutedForeground: '215 12% 64%',
      accent: '159 36% 12%',
      accentForeground: '159 86% 82%',
      border: '222 10% 16%',
      input: '222 10% 16%',
      ring: '159 84% 52%',
      glassBg: 'rgba(255, 255, 255, 0.023)',
      glassBorder: 'rgba(16, 185, 129, 0.16)',
      bodyGradient: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.075), transparent 28%)',
    },
  },
};
