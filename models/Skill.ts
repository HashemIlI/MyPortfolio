import 'server-only';

import { Schema, Document, Model, models, model } from 'mongoose';

export type SkillCategory =
  | 'Machine Learning'
  | 'Deep Learning'
  | 'Programming'
  | 'Data Visualisation'
  | 'Tools & Platforms'
  | 'Soft Skills';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export const SKILL_CATEGORIES: SkillCategory[] = [
  'Machine Learning',
  'Deep Learning',
  'Programming',
  'Data Visualisation',
  'Tools & Platforms',
  'Soft Skills',
];

export const SKILL_LEVEL_VALUES: Record<SkillLevel, number> = {
  Beginner: 25,
  Intermediate: 50,
  Advanced: 75,
  Expert: 95,
};

export interface ISkill extends Document {
  nameEn: string;
  nameAr: string;
  category: SkillCategory;
  level: SkillLevel;
  icon: string;
  visible: boolean;
  order: number;
}

const SkillSchema = new Schema<ISkill>(
  {
    nameEn: { type: String, required: true },
    nameAr: { type: String, default: '' },
    category: { type: String, enum: SKILL_CATEGORIES, required: true },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate',
    },
    icon: { type: String, default: '' },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Skill = (models.Skill as Model<ISkill>) || model<ISkill>('Skill', SkillSchema);

export default Skill;
