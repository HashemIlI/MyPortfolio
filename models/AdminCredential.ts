import 'server-only';

import { Schema, type Document, type Model, models, model } from 'mongoose';

export interface IAdminCredential extends Document {
  username: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lastFailedLoginAt: Date | null;
  lockUntil: Date | null;
}

const AdminCredentialSchema = new Schema<IAdminCredential>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedLoginAt: { type: Date, default: null },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

const AdminCredential =
  (models.AdminCredential as Model<IAdminCredential>) ||
  model<IAdminCredential>('AdminCredential', AdminCredentialSchema);

export default AdminCredential;
