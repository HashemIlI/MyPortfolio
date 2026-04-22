'use client';

import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SectionWrapper from '@/components/SectionWrapper';
import { Badge } from '@/components/ui/badge';
import type { ExperienceData } from '@/types/content';

interface ExperienceProps {
  experiences: ExperienceData[];
}

export default function Experience({ experiences }: ExperienceProps) {
  const { language, t } = useLanguage();

  return (
    <SectionWrapper id="experience" className="py-14 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-2 text-sm font-medium text-primary uppercase tracking-[0.22em]">
            {t('My Journey', 'مسيرتي')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t('Work Experience', 'الخبرة العملية')}
          </h2>
        </div>

        <div className="relative">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-primary/40 via-border to-transparent sm:left-5" />

          <div className="space-y-8">
            {experiences.map((exp, i) => (
              <motion.div
                key={String(exp._id)}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="relative pl-11 sm:pl-14"
              >
                <div className="absolute left-2 top-1 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-primary bg-background sm:left-2.5">
                  <Briefcase className="h-2.5 w-2.5 text-primary" />
                </div>

                <div className="glass rounded-2xl p-4 transition-colors hover:border-primary/30 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {language === 'ar' ? exp.titleAr || exp.titleEn : exp.titleEn}
                      </h3>
                      <p className="mt-0.5 text-sm font-medium text-primary">
                        {language === 'ar' ? exp.companyAr || exp.companyEn : exp.companyEn}
                      </p>
                    </div>
                    <div className="flex min-w-[8rem] flex-col gap-1.5 sm:items-end">
                      <span className="text-xs text-muted-foreground">
                        {language === 'ar' ? exp.durationAr || exp.durationEn : exp.durationEn}
                      </span>
                      {exp.current && (
                        <Badge variant="success" className="text-xs">
                          {t('Current', 'حالياً')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const bullets = language === 'ar'
                      ? (exp.bulletsAr?.length ? exp.bulletsAr : exp.bulletsEn)
                      : exp.bulletsEn;
                    return bullets?.length ? (
                      <ul className="mb-4 space-y-2">
                        {bullets.map((b, bi) => (
                          <li key={bi} className="flex gap-2.5 text-sm text-muted-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null;
                  })()}

                  {exp.tools?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {exp.tools.map((tool) => (
                        <Badge key={tool} variant="skill" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {experiences.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            {t('No experience entries yet.', 'لا توجد خبرات بعد.')}
          </p>
        )}
      </div>
    </SectionWrapper>
  );
}
