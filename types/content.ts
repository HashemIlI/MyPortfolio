export interface ProfileData {
  _id?: string;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  profileImage: string;
  cvFile: string;
  summaryEn: string;
  summaryAr: string;
  aboutEn: string;
  aboutAr: string;
  aboutImage: string;
  email: string;
  phone: string;
  locationEn: string;
  locationAr: string;
  github: string;
  linkedin: string;
  kaggle: string;
  whatsapp: string;
  twitter: string;
  ctaHireMeEn: string;
  ctaHireMeAr: string;
  ctaDownloadCvEn: string;
  ctaDownloadCvAr: string;
  availableForWork: boolean;
  availabilityLabelEn: string;
  availabilityLabelAr: string;
}

export interface ExperienceData {
  _id?: string;
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

export interface EducationData {
  _id?: string;
  degreeEn: string;
  degreeAr: string;
  institutionEn: string;
  institutionAr: string;
  fieldOfStudyEn: string;
  fieldOfStudyAr: string;
  startDate: string;
  endDate: string;
  grade: string;
  descriptionEn: string;
  descriptionAr: string;
  logo?: string;
  visible: boolean;
  order: number;
}

export interface CertificationData {
  _id?: string;
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
