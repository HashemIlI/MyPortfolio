'use client';

import { motion } from 'framer-motion';
import { Award, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SectionWrapper from '@/components/SectionWrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CertificationData } from '@/types/content';

interface CertificationsProps {
  certifications: CertificationData[];
}

export default function Certifications({ certifications }: CertificationsProps) {
  const { language, t } = useLanguage();

  const featured = certifications.filter((c) => c.featured);
  const others = certifications.filter((c) => !c.featured);

  return (
    <SectionWrapper id="certifications" className="py-14 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-2 text-sm font-medium text-primary uppercase tracking-[0.22em]">
            {t('Credentials', 'الاعتمادات')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            {t('Certifications', 'الشهادات')}
          </h2>
        </div>

        {featured.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:mb-8 lg:grid-cols-3 lg:gap-6">
            {featured.map((cert, i) => (
              <CertCard key={String(cert._id)} cert={cert} index={i} language={language} t={t} featured />
            ))}
          </div>
        )}

        {others.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {others.map((cert, i) => (
              <CertCard key={String(cert._id)} cert={cert} index={i} language={language} t={t} />
            ))}
          </div>
        )}

        {certifications.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            {t('No certifications yet.', 'لا توجد شهادات بعد.')}
          </p>
        )}
      </div>
    </SectionWrapper>
  );
}

function CertCard({
  cert, index, language, t, featured = false,
}: {
  cert: CertificationData;
  index: number;
  language: string;
  t: (en: string, ar: string) => string;
  featured?: boolean;
}) {
  const description = language === 'ar' ? cert.descriptionAr || cert.descriptionEn : cert.descriptionEn;
  const name = language === 'ar' ? cert.nameAr || cert.nameEn : cert.nameEn;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`glass group flex h-full flex-col rounded-2xl p-5 sm:p-6 text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5 ${
        featured ? 'ring-1 ring-primary/15' : ''
      }`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/10">
          <Award className="h-5 w-5" />
        </div>
        {featured && (
          <Badge variant="success" className="border border-primary/15 bg-primary/10 text-[11px] text-primary">
            {t('Featured', 'مميز')}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <h3 className="text-lg font-semibold leading-snug text-card-foreground">{name}</h3>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-primary/90">{cert.issuer}</span>
          {cert.date && (
            <span className="text-xs text-muted-foreground/90">{cert.date}</span>
          )}
        </div>

        {description && (
          <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
        )}

        {cert.credentialUrl && (
          <Button
            variant="outline"
            size="sm"
            className="mt-6 w-full rounded-xl border-primary/15 bg-background/60 text-foreground transition-all duration-300 hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
            asChild
          >
            <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              {t('View Credential', 'عرض الشهادة')}
            </a>
          </Button>
        )}
      </div>
    </motion.article>
  );
}
