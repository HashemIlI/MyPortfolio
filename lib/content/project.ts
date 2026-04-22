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

export interface ProjectData {
  _id: string;
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
  createdAt?: string;
  updatedAt?: string;
}
