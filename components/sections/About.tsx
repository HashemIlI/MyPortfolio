'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import SectionWrapper from '@/components/SectionWrapper';
import type { ProfileData } from '@/types/content';

interface AboutProps {
  profile: ProfileData | null;
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?؟])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export default function About({ profile }: AboutProps) {
  const { language, t, isRTL } = useLanguage();

  const about = profile
    ? (language === 'ar' ? profile.aboutAr || profile.aboutEn : profile.aboutEn)
    : '';
  const summary = profile
    ? (language === 'ar' ? profile.summaryAr || profile.summaryEn : profile.summaryEn)
    : '';

  const summarySentences = splitSentences(summary);
  const aboutSentences = splitSentences(about);

  const intro = summarySentences.slice(0, 2).join(' ') || aboutSentences.slice(0, 2).join(' ');
  const support = aboutSentences.slice(0, 1).join(' ') || summarySentences.slice(0, 1).join(' ');

  const highlights = language === 'ar'
    ? [
        'أحوّل البيانات الخام إلى رؤى وقرارات قابلة للتنفيذ.',
        'أعمل عبر دورة حياة تعلم الآلة من جمع البيانات حتى التقييم والنشر.',
        'أستخدم Python وSQL وTensorFlow وPower BI لبناء حلول عملية.',
        'أركز على المشكلات الواقعية التي تربط التحليل بسياق الأعمال.',
      ]
    : [
        'Turn raw data into actionable insights and decisions.',
        'Work across the full machine learning lifecycle from data collection to deployment.',
        'Build practical solutions with Python, SQL, TensorFlow, and Power BI.',
        'Focus on real-world problems where analytics meets business context.',
      ];

  return (
    <SectionWrapper id="about" className="py-10 lg:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-4 lg:grid-cols-[1.45fr_0.85fr] lg:gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="space-y-3.5"
          >
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">
              {t('About', 'نبذة')}
            </p>

            <div className="max-w-[62ch] space-y-3">
              <p className="text-[15px] leading-7 text-foreground/92">
                {intro}
              </p>
              <p className="text-[13px] leading-6 text-muted-foreground">
                {support}
              </p>
              <p className="text-[13px] leading-6 text-muted-foreground">
                {t(
                  'I build analytical and machine learning work that is technically solid, tied to business context, and useful in real decision-making.',
                  'أبني أعمالاً تحليلية وحلول تعلم آلة تكون قوية تقنياً، ومرتبطة بسياق الأعمال، ومفيدة في اتخاذ القرار الفعلي.'
                )}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="glass rounded-xl p-3.5 sm:p-4"
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-primary/90">
              {t('Highlights', 'أبرز النقاط')}
            </p>
            <div className="space-y-2">
              {highlights.map((highlight, index) => (
                <div
                  key={index}
                  className={`rounded-lg border border-border/60 bg-background/25 px-3 py-2.5 ${isRTL ? 'text-right' : ''}`}
                >
                  <p className="text-[13px] leading-5 text-muted-foreground">
                    {highlight}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  );
}
