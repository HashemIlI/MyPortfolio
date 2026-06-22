import 'server-only';

import { Schema, Document, Model, models, model } from 'mongoose';

type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface ISkill extends Document {
  nameEn: string;
  nameAr: string;
  category: string;
  level: SkillLevel;
  icon: string;
  visible: boolean;
  order: number;
}

const SkillSchema = new Schema<ISkill>(
  {
    nameEn: { type: String, required: true },
    nameAr: { type: String, default: '' },
    category: { type: String, required: true },
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
