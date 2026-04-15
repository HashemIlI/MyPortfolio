export type SkillCategory =
  | 'Machine Learning'
  | 'Deep Learning'
  | 'Programming'
  | 'Data Visualisation'
  | 'Tools & Platforms'
  | 'Soft Skills';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export const SKILL_CATEGORIES: SkillCategory[] = [
  'Machine Learning',
  'Deep Learning',
  'Programming',
  'Data Visualisation',
  'Tools & Platforms',
  'Soft Skills',
];

export const SKILL_LEVEL_VALUES: Record<SkillLevel, number> = {
  Beginner: 25,
  Intermediate: 50,
  Advanced: 75,
  Expert: 95,
};

export interface SkillData {
  _id: string;
  nameEn: string;
  nameAr: string;
  category: SkillCategory;
  level: SkillLevel;
  icon: string;
  visible: boolean;
  order: number;
}
