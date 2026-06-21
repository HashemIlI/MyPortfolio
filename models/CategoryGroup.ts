import 'server-only';

import { Schema, Document, Model, models, model } from 'mongoose';

export interface ICategoryGroup extends Document {
  name: string;
  slug: string;
  description: string;
  visible: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategoryGroupSchema = new Schema<ICategoryGroup>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    visible: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategoryGroupSchema.index({ visible: 1, sortOrder: 1 });

const CategoryGroup =
  (models.CategoryGroup as Model<ICategoryGroup>) ||
  model<ICategoryGroup>('CategoryGroup', CategoryGroupSchema);

export default CategoryGroup;
