export type ColorThemePreset =
  | 'default'
  | 'emerald-pro'
  | 'blue-tech'
  | 'purple-ai'
  | 'cyan-data'
  | 'amber-minimal'
  | 'monochrome'
  | 'neon-dark';
export type RadiusPreset = 'soft' | 'rounded' | 'sharp';
export type CardStylePreset = 'premium' | 'glass' | 'minimal';
export type TypographyPreset = 'compact' | 'balanced' | 'large';
export type SectionSpacingPreset = 'tight' | 'normal' | 'relaxed';

export interface ThemeSettingsData {
  _id?: string;
  colorTheme: ColorThemePreset;
  radius: RadiusPreset;
  cardStyle: CardStylePreset;
  typographyScale: TypographyPreset;
  sectionSpacing: SectionSpacingPreset;
  updatedAt?: string;
}
