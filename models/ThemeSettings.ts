import { Schema, Document, Model, models, model } from 'mongoose';

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

export interface IThemeSettings extends Document {
  singletonKey: string;
  colorTheme: ColorThemePreset;
  radius: RadiusPreset;
  cardStyle: CardStylePreset;
  typographyScale: TypographyPreset;
  sectionSpacing: SectionSpacingPreset;
}

const ThemeSettingsSchema = new Schema<IThemeSettings>(
  {
    singletonKey: { type: String, default: 'theme', unique: true, immutable: true },
    colorTheme: {
      type: String,
      enum: [
        'default',
        'emerald-pro',
        'blue-tech',
        'purple-ai',
        'cyan-data',
        'amber-minimal',
        'monochrome',
        'neon-dark',
      ],
      default: 'default',
    },
    radius: {
      type: String,
      enum: ['soft', 'rounded', 'sharp'],
      default: 'soft',
    },
    cardStyle: {
      type: String,
      enum: ['premium', 'glass', 'minimal'],
      default: 'premium',
    },
    typographyScale: {
      type: String,
      enum: ['compact', 'balanced', 'large'],
      default: 'balanced',
    },
    sectionSpacing: {
      type: String,
      enum: ['tight', 'normal', 'relaxed'],
      default: 'normal',
    },
  },
  { timestamps: true }
);

const ThemeSettings =
  (models.ThemeSettings as Model<IThemeSettings>) ||
  model<IThemeSettings>('ThemeSettings', ThemeSettingsSchema);

export default ThemeSettings;
