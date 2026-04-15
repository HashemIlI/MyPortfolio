import 'server-only';

import { Schema, type Document, type Model, models, model } from 'mongoose';

export interface IAdminCredential extends Document {
  username: string;
  passwordHash: string;
}

const AdminCredentialSchema = new Schema<IAdminCredential>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const AdminCredential =
  (models.AdminCredential as Model<IAdminCredential>) ||
  model<IAdminCredential>('AdminCredential', AdminCredentialSchema);

export default AdminCredential;
