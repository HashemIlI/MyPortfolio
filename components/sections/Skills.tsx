'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SectionWrapper from '@/components/SectionWrapper';
import { Badge } from '@/components/ui/badge';
import { ICON_MAP } from '@/lib/icon-map';
import { cn } from '@/lib/utils';
import type { SkillData, SkillLevel } from '@/lib/content/skill';
import type { SkillCategoryData } from '@/lib/content/skill-category';

/** Rows of pills every card shows while collapsed. The clamp is by row, never by count. */
const VISIBLE_PILL_ROWS = 3;

/**
 * Pill geometry. `leading-4` + `whitespace-nowrap` are load-bearing, not cosmetic: they pin
 * every pill to exactly 16 + 8 (py-1) + 2 (border) = 26px on one line, which is what makes
 * the band height below an exact figure rather than an estimate.
 *
 * Band height = ROWS * pillHeight + (ROWS - 1) * gap, with gap-1.5 (6px) below sm and
 * gap-2 (8px) from sm up:
 *   3 * 26 + 2 * 6 = 90    3 * 26 + 2 * 8 = 94
 * Written as literals because Tailwind scans raw source text — a computed class name would
 * never be generated. Recompute these by hand if the pill padding or font size changes.
 */
const BAND_HEIGHT = 'h-[90px] sm:h-[94px]';

/** Title line (20) + mt-1 (4) + two description lines (2 x 20). Reserved in every card. */
const HEADER_HEIGHT = 'h-16';

/** Fixed 24px between the header and the pill band — a constant, not a residue. */
const HEADER_GAP = 'mt-6';

/** Always rendered so a category with no hidden skills is not shorter than its neighbours. */
const TOGGLE_SLOT = 'mt-1.5 h-7 sm:mt-2';

/** Advanced first, then Intermediate, then Beginner. Ties keep the admin `order`. */
const LEVEL_RANK: Record<SkillLevel, number> = {
  Expert: 0,
  Advanced: 1,
  Intermediate: 2,
  Beginner: 3,
};

/** Levels that get the slightly stronger border/text treatment. */
const EMPHASISED_LEVELS: ReadonlySet<SkillLevel> = new Set<SkillLevel>(['Expert', 'Advanced']);

function sortByLevel(items: SkillData[]): SkillData[] {
  return [...items].sort(
    (a, b) => (LEVEL_RANK[a.level] ?? 99) - (LEVEL_RANK[b.level] ?? 99) || a.order - b.order
  );
}

/** Reveal duration for the hidden-pill drawer. */
const REVEAL_SECONDS = 0.28;

const PILL_ROW = 'flex flex-wrap gap-1.5 sm:gap-2';

/** useLayoutEffect warns when React renders this on the server. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface SkillsProps {
  skillCategories: SkillCategoryData[];
  skills: SkillData[];
}

export default function Skills({ skillCategories, skills }: SkillsProps) {
  const { t } = useLanguage();

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

        <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {groups.map(({ cat, Icon, items }, index) => (
            <SkillCategoryCard key={cat._id} cat={cat} Icon={Icon} items={items} index={index} />
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

interface SkillCategoryCardProps {
  cat: SkillCategoryData;
  Icon: ComponentType<{ className?: string }>;
  items: SkillData[];
  index: number;
}

function SkillCategoryCard({ cat, Icon, items, index }: SkillCategoryCardProps) {
  const { language, t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [revealing, setRevealing] = useState(false);

  // null until the first layout pass has grouped the pills into wrapped rows.
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const sorted = sortByLevel(items);
  const measureKey = `${language}:${sorted.map((skill) => String(skill._id)).join(',')}`;

  /**
   * Groups the pills by distinct offsetTop — one distinct value per wrapped row — and keeps
   * everything up to the end of row VISIBLE_PILL_ROWS. Counting rows rather than pills is
   * what makes the split land on a row boundary no matter how the labels wrap.
   */
  const measure = useCallback(() => {
    const element = measureRef.current;
    if (!element) return;

    const rowTops: number[] = [];
    let count = 0;
    for (const child of Array.from(element.children) as HTMLElement[]) {
      const top = Math.round(child.offsetTop);
      if (!rowTops.includes(top)) {
        if (rowTops.length === VISIBLE_PILL_ROWS) break;
        rowTops.push(top);
      }
      count += 1;
    }
    setVisibleCount(count);
  }, []);

  useIsomorphicLayoutEffect(() => {
    measure();

    const element = measureRef.current;
    if (!element) return;

    // Width changes move the wrap points; so does a late webfont swap.
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    let cancelled = false;
    document.fonts?.ready
      .then(() => {
        if (!cancelled) measure();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [measure, measureKey]);

  const measured = visibleCount !== null;
  const visiblePills = measured ? sorted.slice(0, visibleCount) : sorted;
  const hiddenPills = measured ? sorted.slice(visibleCount) : [];
  const hiddenCount = hiddenPills.length;
  const hasMore = hiddenCount > 0;
  const listId = `skill-pills-${cat.slug}`;

  const renderPill = (skill: SkillData) => (
    <Badge
      key={String(skill._id)}
      variant="skill"
      className={cn(
        'whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium leading-4 tracking-[0.01em] transition-all duration-200 hover:border-primary/45 hover:bg-primary/10 hover:shadow-[0_0_14px_rgba(34,197,94,0.10)]',
        // Note: Tailwind's opacity scale has no /18 or /82 step, so the `skill`
        // variant's defaults never render. Both tiers are set explicitly here.
        EMPHASISED_LEVELS.has(skill.level)
          ? 'border-primary/40 text-foreground dark:text-emerald-50'
          : 'border-primary/20 text-foreground/70 dark:text-emerald-50/85'
      )}
    >
      {language === 'ar' ? skill.nameAr || skill.nameEn : skill.nameEn}
    </Badge>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="glass rounded-2xl border border-border/70 p-4 sm:p-5 transition-colors duration-300 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className={cn(HEADER_HEIGHT, 'flex items-start gap-3')}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm shadow-primary/10">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {language === 'ar' ? cat.nameAr || cat.nameEn : cat.nameEn}
          </h3>
          {/* h-10 reserves both lines even when the copy only fills one. */}
          <p className="mt-1 line-clamp-2 h-10 text-xs leading-5 text-muted-foreground">
            {language === 'ar' ? cat.descriptionAr || cat.descriptionEn : cat.descriptionEn}
          </p>
        </div>
      </div>

      <div className={cn('relative', HEADER_GAP)}>
        {/* Off-screen twin holding every pill at the band's exact width. It is the only place
            the full set is laid out, so the row split can be re-derived at any time — the
            band itself only ever contains the pills the last measurement kept. */}
        <div
          ref={measureRef}
          aria-hidden
          className={cn(PILL_ROW, 'pointer-events-none invisible absolute inset-x-0 top-0')}
        >
          {sorted.map(renderPill)}
        </div>

        {/* Bottom-anchored: a card that only fills two rows leaves the empty row at the top.
            Before the first measurement the band still holds every pill, so it anchors to the
            top instead — otherwise the overflow would push the first rows out of view. */}
        <div
          className={cn(
            'flex flex-col overflow-hidden',
            BAND_HEIGHT,
            measured ? 'justify-end' : 'justify-start'
          )}
        >
          <div className={PILL_ROW}>{visiblePills.map(renderPill)}</div>
        </div>
      </div>

      {hasMore && (
        <motion.div
          id={listId}
          initial={false}
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : REVEAL_SECONDS, ease: 'easeOut' }}
          onAnimationComplete={() => setRevealing(false)}
          // Clipped for the whole reveal so pills are uncovered *by* the growing height
          // rather than painting ahead of it. Released once settled so focus rings and
          // hover glows aren't cut off.
          style={{ overflow: expanded && !revealing ? 'visible' : 'hidden' }}
        >
          <div className={cn(PILL_ROW, 'pt-1.5 sm:pt-2')}>{hiddenPills.map(renderPill)}</div>
        </motion.div>
      )}

      <div className={TOGGLE_SLOT}>
        {hasMore && (
          <button
            type="button"
            onClick={() => {
              // Clip synchronously in the same render as the state flip — waiting for
              // onAnimationStart leaves one frame where the drawer is still 0-high but
              // already overflow:visible, so the pills lay out below the card.
              setRevealing(true);
              setExpanded((value) => !value);
            }}
            aria-expanded={expanded}
            aria-controls={listId}
            className="inline-flex items-center rounded-full border border-primary/25 bg-primary/[0.06] px-2.5 py-1 text-[11px] font-medium tracking-[0.01em] text-muted-foreground transition-all duration-200 hover:border-primary/45 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {expanded
              ? t('Show less', 'عرض أقل')
              : t(`+${hiddenCount} more`, `+${hiddenCount} أخرى`)}
          </button>
        )}
      </div>
    </motion.div>
  );
}
