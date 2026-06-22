import mongoose, { Schema, Document, Model, models, model } from 'mongoose';

export interface IProfile extends Document {
  // Hero
  nameEn: string;
  nameAr: string;
  headlineEn: string;
  headlineAr: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  profileImage: string;
  profilePhotoPosition: string;
  showProfilePhoto: boolean;
  cvFile: string;
  // Summary
  summaryEn: string;
  summaryAr: string;
  // About
  aboutEn: string;
  aboutAr: string;
  aboutImage: string;
  // Contact
  email: string;
  phone: string;
  locationEn: string;
  locationAr: string;
  // Social
  github: string;
  linkedin: string;
  kaggle: string;
  whatsapp: string;
  twitter: string;
  // CTA labels
  ctaHireMeEn: string;
  ctaHireMeAr: string;
  ctaDownloadCvEn: string;
  ctaDownloadCvAr: string;
  // Availability
  availableForWork: boolean;
  availabilityLabelEn: string;
  availabilityLabelAr: string;
  // About highlights
  highlightsEn: string[];
  highlightsAr: string[];
}

const ProfileSchema = new Schema<IProfile>(
  {
    nameEn: { type: String, default: '' },
    nameAr: { type: String, default: '' },
    headlineEn: { type: String, default: '' },
    headlineAr: { type: String, default: '' },
    titleEn: { type: String, default: '' },
    titleAr: { type: String, default: '' },
    subtitleEn: { type: String, default: '' },
    subtitleAr: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    profilePhotoPosition: { type: String, default: 'center' },
    showProfilePhoto: { type: Boolean, default: true },
    cvFile: { type: String, default: '' },
    summaryEn: { type: String, default: '' },
    summaryAr: { type: String, default: '' },
    aboutEn: { type: String, default: '' },
    aboutAr: { type: String, default: '' },
    aboutImage: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    locationEn: { type: String, default: '' },
    locationAr: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    kaggle: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    twitter: { type: String, default: '' },
    ctaHireMeEn: { type: String, default: 'Hire Me' },
    ctaHireMeAr: { type: String, default: 'وظّفني' },
    ctaDownloadCvEn: { type: String, default: 'Download CV' },
    ctaDownloadCvAr: { type: String, default: 'تحميل السيرة الذاتية' },
    availableForWork: { type: Boolean, default: true },
    availabilityLabelEn: { type: String, default: 'Available for work' },
    availabilityLabelAr: { type: String, default: 'متاح للعمل' },
    highlightsEn: {
      type: [String],
      default: [
        'Turn raw data into actionable insights and decisions.',
        'Work across the full machine learning lifecycle from data collection to deployment.',
        'Build practical solutions with Python, SQL, TensorFlow, and Power BI.',
        'Focus on real-world problems where analytics meets business context.',
      ],
    },
    highlightsAr: {
      type: [String],
      default: [
        'أحوّل البيانات الخام إلى رؤى وقرارات قابلة للتنفيذ.',
        'أعمل عبر دورة حياة تعلم الآلة من جمع البيانات حتى التقييم والنشر.',
        'أستخدم Python وSQL وTensorFlow وPower BI لبناء حلول عملية.',
        'أركز على المشكلات الواقعية التي تربط التحليل بسياق الأعمال.',
      ],
    },
  },
  { timestamps: true }
);

const Profile =
  (models.Profile as Model<IProfile>) || model<IProfile>('Profile', ProfileSchema);

export default Profile;
