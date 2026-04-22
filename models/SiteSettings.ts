import 'server-only';

import { Schema, type Document, type Model, models, model } from 'mongoose';

export interface ISectionSetting {
  key: string;
  labelEn: string;
  labelAr: string;
  visible: boolean;
  order: number;
}

export interface IAnalyticsSettings {
  googleAnalyticsId: string;
  enabled: boolean;
}

export interface ISiteSettings extends Document {
  siteTitleEn: string;
  siteTitleAr: string;
  defaultMetaTitleEn: string;
  defaultMetaTitleAr: string;
  siteNameEn: string;
  siteNameAr: string;
  defaultMetaDescriptionEn: string;
  defaultMetaDescriptionAr: string;
  siteDescriptionEn: string;
  siteDescriptionAr: string;
  siteKeywords: string[];
  ogTitleEn: string;
  ogTitleAr: string;
  ogDescriptionEn: string;
  ogDescriptionAr: string;
  ogImage: string;
  favicon: string;
  primaryColor: string;
  accentColor: string;
  defaultTheme: 'dark' | 'light';
  defaultLanguage: 'en' | 'ar';
  sections: ISectionSetting[];
  analytics: IAnalyticsSettings;
  maintenanceMode: boolean;
  footerTextEn: string;
  footerTextAr: string;
}

const SectionSettingSchema = new Schema<ISectionSetting>(
  {
    key: { type: String, required: true },
    labelEn: { type: String, default: '' },
    labelAr: { type: String, default: '' },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteTitleEn: { type: String, default: 'Ahmed Fouad Hashem' },
    siteTitleAr: { type: String, default: 'أحمد فؤاد هاشم' },
    defaultMetaTitleEn: { type: String, default: 'Ahmed Fouad Hashem | Data Analyst & Applied AI Specialist' },
    defaultMetaTitleAr: { type: String, default: 'أحمد فؤاد هاشم | محلل بيانات ومتخصص في الذكاء الاصطناعي التطبيقي' },
    siteNameEn: { type: String, default: 'Ahmed Fouad Hashem' },
    siteNameAr: { type: String, default: 'أحمد فؤاد هاشم' },
    defaultMetaDescriptionEn: {
      type: String,
      default: 'Data Analyst & Applied AI Specialist',
    },
    defaultMetaDescriptionAr: {
      type: String,
      default: 'محلل بيانات ومتخصص في الذكاء الاصطناعي التطبيقي',
    },
    siteDescriptionEn: {
      type: String,
      default: 'Data Analyst & Applied AI Specialist',
    },
    siteDescriptionAr: {
      type: String,
      default: 'محلل بيانات ومتخصص في الذكاء الاصطناعي التطبيقي',
    },
    siteKeywords: {
      type: [String],
      default: ['data analyst', 'AI', 'machine learning', 'Python'],
    },
    ogTitleEn: { type: String, default: '' },
    ogTitleAr: { type: String, default: '' },
    ogDescriptionEn: { type: String, default: '' },
    ogDescriptionAr: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    favicon: { type: String, default: '' },
    primaryColor: { type: String, default: '#090b09' },
    accentColor: { type: String, default: '#3f7d57' },
    defaultTheme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    defaultLanguage: { type: String, enum: ['en', 'ar'], default: 'en' },
    sections: {
      type: [SectionSettingSchema],
      default: [
        { key: 'hero', labelEn: 'Hero', labelAr: 'الرئيسية', visible: true, order: 1 },
        { key: 'about', labelEn: 'About', labelAr: 'عن', visible: true, order: 2 },
        { key: 'skills', labelEn: 'Skills', labelAr: 'المهارات', visible: true, order: 3 },
        { key: 'experience', labelEn: 'Experience', labelAr: 'الخبرة', visible: true, order: 4 },
        { key: 'education', labelEn: 'Education', labelAr: 'التعليم', visible: true, order: 5 },
        { key: 'projects', labelEn: 'Projects', labelAr: 'المشاريع', visible: true, order: 6 },
        { key: 'certifications', labelEn: 'Certifications', labelAr: 'الشهادات', visible: true, order: 7 },
        { key: 'contact', labelEn: 'Contact', labelAr: 'التواصل', visible: true, order: 8 },
      ],
    },
    analytics: {
      type: new Schema(
        { googleAnalyticsId: String, enabled: Boolean },
        { _id: false }
      ),
      default: { googleAnalyticsId: '', enabled: false },
    },
    maintenanceMode: { type: Boolean, default: false },
    footerTextEn: {
      type: String,
      default: '© 2025 Ahmed Fouad Hashem. All rights reserved.',
    },
    footerTextAr: {
      type: String,
      default: '© 2025 أحمد فؤاد هاشم. جميع الحقوق محفوظة.',
    },
  },
  { timestamps: true }
);

const SiteSettings =
  (models.SiteSettings as Model<ISiteSettings>) ||
  model<ISiteSettings>('SiteSettings', SiteSettingsSchema);

export default SiteSettings;
