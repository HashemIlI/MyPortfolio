import 'server-only';

import { Schema, Document, Model, models, model } from 'mongoose';

export type ProjectCategory =
  | 'Machine Learning'
  | 'Deep Learning'
  | 'NLP'
  | 'Computer Vision'
  | 'Data Analysis'
  | 'Business Intelligence'
  | 'Dashboard'
  | 'Web Scraping'
  | 'Other';

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  'Machine Learning',
  'Deep Learning',
  'NLP',
  'Computer Vision',
  'Data Analysis',
  'Business Intelligence',
  'Dashboard',
  'Web Scraping',
  'Other',
];

export interface IProject extends Document {
  titleEn: string;
  titleAr: string;
  slug: string;
  shortSummaryEn: string;
  shortSummaryAr: string;
  executiveSummaryEn: string;
  executiveSummaryAr: string;
  category: ProjectCategory;
  problemStatementEn: string;
  problemStatementAr: string;
  businessObjectiveEn: string;
  businessObjectiveAr: string;
  datasetOverviewEn: string;
  datasetOverviewAr: string;
  technicalApproachEn: string;
  technicalApproachAr: string;
  modelUsed: string;
  evaluationMetrics: string;
  resultsEn: string;
  resultsAr: string;
  tools: string[];
  githubLink: string;
  liveDemoLink: string;
  kaggleLink: string;
  thumbnail: string;
  screenshots: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImage: string;
  featured: boolean;
  featuredOnHomepage: boolean;
  homepageCategoryOrder: number;
  visible: boolean;
  displayOrder: number;
}

const isValidAbsoluteUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const optionalAbsoluteUrl = {
  validator: (value: string) => value === '' || isValidAbsoluteUrl(value),
  message: 'Must be a valid http:// or https:// URL.',
};

const optionalAssetUrl = {
  validator: (value: string) =>
    value === '' || value.startsWith('/') || isValidAbsoluteUrl(value),
  message: 'Must be an absolute URL or a root-relative /uploads path.',
};

const ProjectSchema = new Schema<IProject>(
  {
    titleEn: { type: String, required: true },
    titleAr: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    shortSummaryEn: { type: String, default: '' },
    shortSummaryAr: { type: String, default: '' },
    executiveSummaryEn: { type: String, default: '' },
    executiveSummaryAr: { type: String, default: '' },
    category: { type: String, enum: PROJECT_CATEGORIES, default: 'Other' },
    problemStatementEn: { type: String, default: '' },
    problemStatementAr: { type: String, default: '' },
    businessObjectiveEn: { type: String, default: '' },
    businessObjectiveAr: { type: String, default: '' },
    datasetOverviewEn: { type: String, default: '' },
    datasetOverviewAr: { type: String, default: '' },
    technicalApproachEn: { type: String, default: '' },
    technicalApproachAr: { type: String, default: '' },
    modelUsed: { type: String, default: '' },
    evaluationMetrics: { type: String, default: '' },
    resultsEn: { type: String, default: '' },
    resultsAr: { type: String, default: '' },
    tools: { type: [String], default: [] },
    githubLink: { type: String, default: '', validate: optionalAbsoluteUrl },
    liveDemoLink: { type: String, default: '', validate: optionalAbsoluteUrl },
    kaggleLink: { type: String, default: '', validate: optionalAbsoluteUrl },
    thumbnail: { type: String, default: '', validate: optionalAssetUrl },
    screenshots: {
      type: [String],
      default: [],
      validate: {
        validator: (values: string[]) => values.every((value) => optionalAssetUrl.validator(value)),
        message: 'Screenshots must be absolute URLs or root-relative /uploads paths.',
      },
    },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: [String], default: [] },
    ogImage: { type: String, default: '', validate: optionalAssetUrl },
    featured: { type: Boolean, default: false },
    featuredOnHomepage: { type: Boolean, default: false },
    homepageCategoryOrder: { type: Number, default: 999 },
    visible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProjectSchema.index({ category: 1, visible: 1 });

const Project = (models.Project as Model<IProject>) || model<IProject>('Project', ProjectSchema);

export default Project;
