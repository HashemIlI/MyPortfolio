import mongoose, { Schema, Document, Model, models, model } from 'mongoose';

export interface IEducation extends Document {
  degreeEn: string;
  degreeAr: string;
  institutionEn: string;
  institutionAr: string;
  fieldOfStudyEn: string;
  fieldOfStudyAr: string;
  startDate: string;
  endDate: string;
  descriptionEn: string;
  descriptionAr: string;
  grade: string;
  logo: string;
  visible: boolean;
  order: number;
}

const EducationSchema = new Schema<IEducation>(
  {
    degreeEn: { type: String, required: true },
    degreeAr: { type: String, default: '' },
    institutionEn: { type: String, required: true },
    institutionAr: { type: String, default: '' },
    fieldOfStudyEn: { type: String, default: '' },
    fieldOfStudyAr: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    descriptionEn: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },
    grade: { type: String, default: '' },
    logo: { type: String, default: '' },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Education =
  (models.Education as Model<IEducation>) || model<IEducation>('Education', EducationSchema);

export default Education;
