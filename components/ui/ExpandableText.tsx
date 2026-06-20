'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  /** Pixel height of the collapsed container (collapsedLines × lineHeightPx). */
  collapsedHeight: number;
  /** Value for -webkit-line-clamp when collapsed. */
  lineClamp: number;
  /** Tailwind classes applied to the <p> element. */
  className?: string;
  /** Tailwind classes applied to the outer wrapper div. */
  wrapperClassName?: string;
  t: (en: string, ar: string) => string;
}

export default function ExpandableText({
  text,
  collapsedHeight,
  lineClamp,
  className = 'text-sm text-muted-foreground',
  wrapperClassName,
  t,
}: ExpandableTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
    const el = textRef.current;
    const wrapperEl = wrapperRef.current;
    if (!el || !wrapperEl) return;

    let raf2: number;
    let raf3: number;

    const check = () => {
      // Cancel any pending two-phase measurement from a previous check call
      // (e.g. rapid-fire resize events) so we only act on the latest layout.
      cancelAnimationFrame(raf2);
      cancelAnimationFrame(raf3);

      const fullHeight = el.scrollHeight;

      if (fullHeight <= collapsedHeight + 1) {
        setIsClamped(false);
        return;
      }

      // Phase 1: apply standard clamp so the CSS grid can equalize card
      // heights based on clamped content before we measure available space.
      setIsClamped(true);

      // Phase 2: after React commits the clamped state (frame N→N+1) and the
      // browser re-equalizes grid row heights (frame N+1→N+2), measure how
      // much space the flex-1 wrapper was actually allocated. Un-clamp if the
      // full text fits within that space — it won't make the card any taller.
      raf2 = requestAnimationFrame(() => {
        raf3 = requestAnimationFrame(() => {
          const available = wrapperEl.clientHeight;
          // Fall back to collapsedHeight if the flex measurement isn't ready
          // (e.g. component used outside a definite-height flex container).
          const safeAvailable = available > collapsedHeight ? available : collapsedHeight;
          setIsClamped(fullHeight > safeAvailable + 1);
        });
      });
    };

    const raf1 = requestAnimationFrame(check);
    window.addEventListener('resize', check);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      cancelAnimationFrame(raf3);
      window.removeEventListener('resize', check);
    };
  }, [text, collapsedHeight]);

  if (!text) return null;

  return (
    <div ref={wrapperRef} className={wrapperClassName}>
      <motion.div
        initial={false}
        animate={{ height: isClamped && !expanded ? collapsedHeight : 'auto' }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <p
          ref={textRef}
          className={className}
          style={
            isClamped && !expanded
              ? {
                  display: '-webkit-box',
                  WebkitLineClamp: lineClamp,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }
              : undefined
          }
        >
          {text}
        </p>
      </motion.div>
      {isClamped && (
        <button
          type="button"
          onClick={() => setExpanded((c) => !c)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary/90 transition-colors hover:text-primary"
        >
          {expanded ? t('Show less', 'عرض أقل') : t('Read more', 'قراءة المزيد')}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}
