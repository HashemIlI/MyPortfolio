'use client';

import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  Briefcase,
  Cpu,
  Database,
  Wrench,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SectionWrapper from '@/components/SectionWrapper';
import { Badge } from '@/components/ui/badge';
import type { SkillData } from '@/lib/content/skill';

interface SkillsProps {
  skills: SkillData[];
}

type SkillGroup = {
  key: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  icon: ComponentType<{ className?: string }>;
  items: SkillData[];
};

export default function Skills({ skills }: SkillsProps) {
  const { language, t } = useLanguage();

  const visibleSkills = skills.filter((skill) => skill.visible);

  const groups: SkillGroup[] = [
    {
      key: 'ml',
      titleEn: 'Machine Learning',
      titleAr: 'تعلم الآلة',
      subtitleEn: 'Predictive models, tuning, and evaluation workflows',
      subtitleAr: 'نماذج تنبؤية وسير عمل الضبط والتقييم',
      icon: Brain,
      items: visibleSkills.filter((skill) => skill.category === 'Machine Learning'),
    },
    {
      key: 'dl',
      titleEn: 'Deep Learning',
      titleAr: 'التعلم العميق',
      subtitleEn: 'Neural networks, architectures, and training pipelines',
      subtitleAr: 'الشبكات العصبية والبنى المعمارية ومسارات التدريب',
      icon: Cpu,
      items: visibleSkills.filter((skill) => skill.category === 'Deep Learning'),
    },
    {
      key: 'analysis',
      titleEn: 'Data Analysis',
      titleAr: 'تحليل البيانات',
      subtitleEn: 'Data wrangling, querying, and exploration',
      subtitleAr: 'تنظيف البيانات والاستعلام والاستكشاف',
      icon: Database,
      items: visibleSkills.filter((skill) => skill.category === 'Programming'),
    },
    {
      key: 'bi',
      titleEn: 'Business Intelligence',
      titleAr: 'ذكاء الأعمال',
      subtitleEn: 'Reporting, dashboards, and decision support',
      subtitleAr: 'التقارير ولوحات المعلومات ودعم القرار',
      icon: BarChart3,
      items: visibleSkills.filter((skill) => skill.category === 'Data Visualisation'),
    },
    {
      key: 'tools',
      titleEn: 'Tools',
      titleAr: 'الأدوات',
      subtitleEn: 'Platforms and daily delivery tooling',
      subtitleAr: 'المنصات والأدوات المستخدمة يومياً',
      icon: Wrench,
      items: visibleSkills.filter((skill) => skill.category === 'Tools & Platforms'),
    },
    {
      key: 'professional',
      titleEn: 'Professional Skills',
      titleAr: 'المهارات المهنية',
      subtitleEn: 'Communication, ownership, and teamwork',
      subtitleAr: 'التواصل وتحمل المسؤولية والعمل الجماعي',
      icon: Briefcase,
      items: visibleSkills.filter((skill) => skill.category === 'Soft Skills'),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <SectionWrapper id="skills" className="py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.22em] text-primary">
            {t('What I work with', 'ما أعمل به')}
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">
            {t('Technical Skills', 'المهارات التقنية')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group, index) => {
            const Icon = group.icon;

            return (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="glass flex h-full flex-col rounded-2xl border border-border/70 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-[5px] hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-3.5 flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/10">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      {language === 'ar' ? group.titleAr : group.titleEn}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {language === 'ar' ? group.subtitleAr : group.subtitleEn}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-1.5 sm:gap-2">
                  {group.items.map((skill) => (
                    <Badge
                      key={String(skill._id)}
                      variant="skill"
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.01em] transition-all duration-200 hover:border-primary/45 hover:bg-primary/10 hover:shadow-[0_0_14px_rgba(34,197,94,0.10)]"
                    >
                      {language === 'ar' ? skill.nameAr || skill.nameEn : skill.nameEn}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {groups.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            {t('No skills available yet.', 'لا توجد مهارات متاحة بعد.')}
          </p>
        )}
      </div>
    </SectionWrapper>
  );
}
