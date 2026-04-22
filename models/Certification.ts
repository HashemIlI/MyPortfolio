import mongoose, { Schema, Document, Model, models, model } from 'mongoose';

export interface ICertification extends Document {
  nameEn: string;
  nameAr: string;
  issuer: string;
  date: string;
  descriptionEn: string;
  descriptionAr: string;
  credentialUrl: string;
  badge: string;
  featured: boolean;
  visible: boolean;
  order: number;
}

const CertificationSchema = new Schema<ICertification>(
  {
    nameEn: { type: String, required: true },
    nameAr: { type: String, default: '' },
    issuer: { type: String, required: true },
    date: { type: String, default: '' },
    descriptionEn: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },
    credentialUrl: { type: String, default: '' },
    badge: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Certification =
  (models.Certification as Model<ICertification>) ||
  model<ICertification>('Certification', CertificationSchema);

export default Certification;
