'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ExternalLink, Github, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SectionWrapper from '@/components/SectionWrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PROJECT_CATEGORIES } from '@/lib/content/project';
import type { ProjectData } from '@/lib/content/project';

interface ProjectsProps {
  projects: ProjectData[];
}

const CATEGORY_AR: Record<string, string> = {
  All: 'الكل',
  'Machine Learning': 'تعلم الآلة',
  'Deep Learning': 'التعلم العميق',
  NLP: 'معالجة اللغة',
  'Computer Vision': 'رؤية الحاسوب',
  'Data Analysis': 'تحليل البيانات',
  'Business Intelligence': 'ذكاء الأعمال',
  Dashboard: 'لوحات المعلومات',
  'Web Scraping': 'استخراج البيانات',
  Other: 'أخرى',
};

const GRID_TRANSITION = { duration: 0.24, ease: 'easeInOut' as const };
const EXTRA_CARD_TRANSITION = { duration: 0.2, ease: 'easeInOut' as const };
const DETAILS_TRANSITION = { duration: 0.22, ease: 'easeInOut' as const };

export default function Projects({ projects }: ProjectsProps) {
  const { language, t } = useLanguage();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleExpandedProject = (id: string) => {
    setExpandedProjects((current) => ({ ...current, [id]: !current[id] }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((current) => ({ ...current, [category]: !current[category] }));
  };

  const groupedProjects = useMemo(
    () =>
      PROJECT_CATEGORIES
        .map((category) => {
          const items = projects
            .filter((project) => project.category === category)
            .sort((a, b) => {
              const featuredDelta = Number(b.featuredOnHomepage) - Number(a.featuredOnHomepage);
              if (featuredDelta !== 0) return featuredDelta;

              const homepageOrderDelta =
                (a.homepageCategoryOrder ?? 999) - (b.homepageCategoryOrder ?? 999);
              if (homepageOrderDelta !== 0) return homepageOrderDelta;

              const displayDelta = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
              if (displayDelta !== 0) return displayDelta;

              return (b.createdAt || '').localeCompare(a.createdAt || '');
            });

          if (items.length === 0) return null;

          const curated = items.filter((project) => project.featuredOnHomepage).slice(0, 3);
          const defaultItems = curated.length > 0 ? curated : items.slice(0, 3);
          const defaultIds = new Set(defaultItems.map((project) => String(project._id)));

          return {
            category,
            items,
            defaultItems,
            extraItems: items.filter((project) => !defaultIds.has(String(project._id))),
          };
        })
        .filter(Boolean) as Array<{
          category: string;
          items: ProjectData[];
          defaultItems: ProjectData[];
          extraItems: ProjectData[];
        }>,
    [projects]
  );

  return (
    <SectionWrapper id="projects" className="bg-muted/10 py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.22em] text-primary">
            {t("What I've built", 'ما بنيته')}
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">
            {t('Selected Work', 'أعمال مختارة')}
          </h2>
        </div>

        <div className="space-y-10">
          {groupedProjects.map(({ category, items, defaultItems, extraItems }) => {
            const isCategoryExpanded = !!expandedCategories[category];
            const hiddenCount = Math.max(items.length - defaultItems.length, 0);

            return (
              <section key={category} className="space-y-4">
                <div className="border-b border-border/60 pb-3">
                  <h3 className="text-xl font-semibold text-foreground">
                    {language === 'ar' ? (CATEGORY_AR[category] || category) : category}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      'A curated selection of work from this category.',
                      'مجموعة مختارة من الأعمال ضمن هذه الفئة.'
                    )}
                  </p>
                </div>

                <motion.div
                  layout="position"
                  transition={GRID_TRANSITION}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
                >
                  {defaultItems.map((project) => (
                    <div key={String(project._id)} className="h-full">
                      <ProjectCard
                        project={project}
                        language={language}
                        t={t}
                        categoryAr={CATEGORY_AR}
                        isExpanded={!!expandedProjects[String(project._id)]}
                        onToggleExpanded={toggleExpandedProject}
                      />
                    </div>
                  ))}

                  <AnimatePresence initial={false}>
                    {isCategoryExpanded &&
                      extraItems.map((project) => (
                        <motion.div
                          key={String(project._id)}
                          layout="position"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={EXTRA_CARD_TRANSITION}
                          className="h-full overflow-hidden"
                        >
                          <ProjectCard
                            project={project}
                            language={language}
                            t={t}
                            categoryAr={CATEGORY_AR}
                            isExpanded={!!expandedProjects[String(project._id)]}
                            onToggleExpanded={toggleExpandedProject}
                          />
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </motion.div>

                {hiddenCount > 0 && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/12 hover:text-primary/90"
                    >
                      <span>
                        {isCategoryExpanded
                          ? t('Show Less', 'عرض أقل')
                          : t('View All Projects', 'عرض كل المشاريع')}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isCategoryExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {groupedProjects.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            {t('No projects available yet.', 'لا توجد مشاريع متاحة بعد.')}
          </p>
        )}
      </div>
    </SectionWrapper>
  );
}

function ProjectCard({
  project,
  language,
  t,
  categoryAr,
  isExpanded,
  onToggleExpanded,
}: {
  project: ProjectData;
  language: string;
  t: (en: string, ar: string) => string;
  categoryAr: Record<string, string>;
  isExpanded: boolean;
  onToggleExpanded: (id: string) => void;
}) {
  const projectId = String(project._id);
  const summary =
    language === 'ar' ? project.shortSummaryAr || project.shortSummaryEn : project.shortSummaryEn;

  return (
    <article className="glass group flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/5">
      {project.thumbnail ? (
        <div className="aspect-video overflow-hidden border-b border-border/60 bg-muted">
          <img
            src={project.thumbnail}
            alt={project.titleEn}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center border-b border-border/60 bg-muted/40">
          <span className="text-4xl font-bold text-primary/25">
            {(project.titleEn || '').charAt(0)}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="skill" className="text-[11px]">
            {language === 'ar' ? (categoryAr[project.category] || project.category) : project.category}
          </Badge>
          {project.featured && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Star className="h-3 w-3 fill-current" />
              {t('Featured', 'مميز')}
            </span>
          )}
          {project.featuredOnHomepage && (
            <span className="flex items-center gap-1 text-xs text-primary/80">
              {t('Homepage', 'الرئيسية')} #{project.homepageCategoryOrder ?? 999}
            </span>
          )}
        </div>

        <div className="mt-3 flex min-h-[8.75rem] flex-col">
          <h3 className="min-h-[2.5rem] text-base font-semibold leading-snug text-foreground">
            {language === 'ar' ? project.titleAr || project.titleEn : project.titleEn}
          </h3>
          <p
            className="mt-1.5 min-h-[3.9rem] text-sm leading-5 text-muted-foreground"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {summary}
          </p>
        </div>

        <div className="mt-3 min-h-[3.1rem]">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {t('Tech Stack', 'التقنيات')}
          </p>
          {project.tools?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {project.tools.slice(0, 5).map((tool) => (
                <Badge key={tool} variant="outline" className="px-1.5 py-0 text-[10px]">
                  {tool}
                </Badge>
              ))}
              {project.tools.length > 5 && (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  +{project.tools.length - 5}
                </Badge>
              )}
            </div>
          ) : (
            <div className="h-[1.75rem]" aria-hidden="true" />
          )}
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={DETAILS_TRANSITION}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2.5 border-t border-border/60 pt-3 text-sm">
                <CaseStudyRow
                  label={t('Problem', 'المشكلة')}
                  content={
                    language === 'ar'
                      ? project.problemStatementAr || project.problemStatementEn
                      : project.problemStatementEn
                  }
                />
                <CaseStudyRow
                  label={t('Objective', 'الهدف')}
                  content={
                    language === 'ar'
                      ? project.businessObjectiveAr || project.businessObjectiveEn
                      : project.businessObjectiveEn
                  }
                />
                <CaseStudyRow
                  label={t('Dataset', 'البيانات')}
                  content={
                    language === 'ar'
                      ? project.datasetOverviewAr || project.datasetOverviewEn
                      : project.datasetOverviewEn
                  }
                />
                <CaseStudyRow
                  label={t('Approach', 'المنهج')}
                  content={
                    language === 'ar'
                      ? project.technicalApproachAr || project.technicalApproachEn
                      : project.technicalApproachEn
                  }
                />
                <CaseStudyRow label={t('Models', 'النماذج')} content={project.modelUsed} />
                <CaseStudyRow label={t('Metrics', 'المقاييس')} content={project.evaluationMetrics} />
                <CaseStudyRow
                  label={t('Results', 'النتائج')}
                  content={language === 'ar' ? project.resultsAr || project.resultsEn : project.resultsEn}
                  highlight
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto flex flex-col gap-2 pt-3">
          <button
            type="button"
            onClick={() => onToggleExpanded(projectId)}
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <span>
              {isExpanded ? t('Show Less', 'عرض أقل') : t('View Case Study', 'عرض دراسة الحالة')}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex flex-wrap gap-1.5">
            {project.githubLink && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 min-w-[8rem] flex-1 gap-1.5 px-3 text-xs transition-colors group-hover:border-primary/40 group-hover:text-primary"
                asChild
              >
                <a href={project.githubLink} target="_blank" rel="noopener noreferrer">
                  <Github className="h-3.5 w-3.5" />
                  {t('GitHub', 'جيت هب')}
                </a>
              </Button>
            )}
            {project.liveDemoLink && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 min-w-[8rem] flex-1 gap-1.5 px-3 text-xs transition-colors group-hover:border-primary/40 group-hover:text-primary"
                asChild
              >
                <a href={project.liveDemoLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t('Demo', 'عرض')}
                </a>
              </Button>
            )}
            {project.kaggleLink && !project.githubLink && !project.liveDemoLink && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 min-w-[8rem] flex-1 gap-1.5 px-3 text-xs transition-colors group-hover:border-primary/40 group-hover:text-primary"
                asChild
              >
                <a href={project.kaggleLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Kaggle
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function CaseStudyRow({
  label,
  content,
  highlight = false,
}: {
  label: string;
  content?: string;
  highlight?: boolean;
}) {
  if (!content) return null;

  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? 'border-primary/20 bg-primary/10' : 'border-border/60 bg-background/30'
      }`}
    >
      <p
        className={`text-[11px] uppercase tracking-[0.18em] ${
          highlight ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-foreground/90">{content}</p>
    </div>
  );
}
