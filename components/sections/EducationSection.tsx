'use client';

import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SectionWrapper from '@/components/SectionWrapper';
import type { EducationData } from '@/types/content';

interface EducationSectionProps {
  education: EducationData[];
}

export default function EducationSection({ education }: EducationSectionProps) {
  const { language, t } = useLanguage();

  return (
    <SectionWrapper id="education" className="py-14 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-2 text-sm font-medium text-primary uppercase tracking-[0.22em]">
            {t('Academic background', 'الخلفية الأكاديمية')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t('Education', 'التعليم')}
          </h2>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {education.map((edu, i) => (
            <motion.div
              key={String(edu._id)}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="glass flex items-start gap-4 rounded-2xl p-4 transition-colors hover:border-primary/30 sm:gap-5 sm:p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {language === 'ar' ? edu.degreeAr || edu.degreeEn : edu.degreeEn}
                  </h3>
                  {(edu.startDate || edu.endDate) && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}
                    </span>
                  )}
                </div>

                <p className="mb-1 text-sm font-medium text-primary">
                  {language === 'ar' ? edu.institutionAr || edu.institutionEn : edu.institutionEn}
                </p>

                {(edu.fieldOfStudyEn || edu.fieldOfStudyAr) && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {language === 'ar' ? edu.fieldOfStudyAr || edu.fieldOfStudyEn : edu.fieldOfStudyEn}
                  </p>
                )}

                {edu.grade && (
                  <p className="text-xs text-muted-foreground">
                    {t('Grade:', 'الدرجة:')} {edu.grade}
                  </p>
                )}

                {(edu.descriptionEn || edu.descriptionAr) && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {language === 'ar' ? edu.descriptionAr || edu.descriptionEn : edu.descriptionEn}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {education.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            {t('No education entries yet.', 'لا توجد سجلات تعليمية بعد.')}
          </p>
        )}
      </div>
    </SectionWrapper>
  );
}
