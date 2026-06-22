import 'server-only';

import { Schema, Document, Model, models, model } from 'mongoose';

export interface ISkillCategory extends Document {
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  visible: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const SkillCategorySchema = new Schema<ISkillCategory>(
  {
    nameEn: { type: String, required: true, trim: true, maxlength: 120 },
    nameAr: { type: String, default: '', trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    descriptionEn: { type: String, default: '', trim: true, maxlength: 500 },
    descriptionAr: { type: String, default: '', trim: true, maxlength: 500 },
    icon: { type: String, default: 'Brain', trim: true },
    visible: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SkillCategorySchema.index({ visible: 1, sortOrder: 1 });

const SkillCategory =
  (models.SkillCategory as Model<ISkillCategory>) ||
  model<ISkillCategory>('SkillCategory', SkillCategorySchema);

export default SkillCategory;
