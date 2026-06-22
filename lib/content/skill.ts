export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface SkillData {
  _id: string;
  nameEn: string;
  nameAr: string;
  category: string;
  level: SkillLevel;
  icon: string;
  visible: boolean;
  order: number;
}
