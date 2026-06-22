'use client';

import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SectionWrapper from '@/components/SectionWrapper';
import { Badge } from '@/components/ui/badge';
import { ICON_MAP } from '@/lib/icon-map';
import type { SkillData } from '@/lib/content/skill';
import type { SkillCategoryData } from '@/lib/content/skill-category';

interface SkillsProps {
  skillCategories: SkillCategoryData[];
  skills: SkillData[];
}

export default function Skills({ skillCategories, skills }: SkillsProps) {
  const { language, t } = useLanguage();

  const visibleSkills = skills.filter((skill) => skill.visible);

  const groups = skillCategories
    .filter((cat) => cat.visible)
    .map((cat) => ({
      cat,
      Icon: ICON_MAP[cat.icon] ?? Brain,
      items: visibleSkills.filter((skill) => skill.category === cat.slug),
    }))
    .filter((group) => group.items.length > 0);

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
          {groups.map(({ cat, Icon, items }, index) => (
            <motion.div
              key={cat._id}
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
                    {language === 'ar' ? cat.nameAr || cat.nameEn : cat.nameEn}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {language === 'ar' ? cat.descriptionAr || cat.descriptionEn : cat.descriptionEn}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-1.5 sm:gap-2">
                {items.map((skill) => (
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
          ))}
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
