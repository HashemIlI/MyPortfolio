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
  const [isClamped, setIsClamped] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
    const el = textRef.current;
    if (!el) return;

    const check = () => {
      if (!el) return;
      // scrollHeight always reflects full content height regardless of
      // overflow:hidden or -webkit-line-clamp, so this comparison is reliable.
      setIsClamped(el.scrollHeight > collapsedHeight + 1);
    };

    const frame = requestAnimationFrame(check);
    window.addEventListener('resize', check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', check);
    };
  }, [text, collapsedHeight]);

  if (!text) return null;

  return (
    <div className={wrapperClassName}>
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
