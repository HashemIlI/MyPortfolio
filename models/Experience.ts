import mongoose, { Schema, Document, Model, models, model } from 'mongoose';

export interface IExperience extends Document {
  titleEn: string;
  titleAr: string;
  companyEn: string;
  companyAr: string;
  durationEn: string;
  durationAr: string;
  bulletsEn: string[];
  bulletsAr: string[];
  tools: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImage: string;
  current: boolean;
  visible: boolean;
  order: number;
}

const ExperienceSchema = new Schema<IExperience>(
  {
    titleEn: { type: String, required: true },
    titleAr: { type: String, default: '' },
    companyEn: { type: String, required: true },
    companyAr: { type: String, default: '' },
    durationEn: { type: String, required: true },
    durationAr: { type: String, default: '' },
    bulletsEn: { type: [String], default: [] },
    bulletsAr: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: [String], default: [] },
    ogImage: { type: String, default: '' },
    current: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Experience =
  (models.Experience as Model<IExperience>) || model<IExperience>('Experience', ExperienceSchema);

export default Experience;
