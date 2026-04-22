import type { ProjectCategory, ProjectData } from './project';

export interface CategoryGroupData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  sourceCategories: ProjectCategory[];
  visible: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectDisplayGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  sourceCategories: ProjectCategory[];
  visible: boolean;
  sortOrder: number;
  fallback: boolean;
  projects: ProjectData[];
}
