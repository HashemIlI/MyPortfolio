'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Moon, Sun, Languages, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type NavLink = { label: string; href: string; scroll: boolean };
type NavSection = { key: string; labelEn: string; labelAr: string };

const NAV_LINKS_EN: NavLink[] = [
  { label: 'About', href: '#about', scroll: true },
  { label: 'Skills', href: '#skills', scroll: true },
  { label: 'Experience', href: '#experience', scroll: true },
  { label: 'Education', href: '#education', scroll: true },
  { label: 'Projects', href: '#projects', scroll: true },
  { label: 'Certifications', href: '#certifications', scroll: true },
  { label: 'Contact', href: '#contact', scroll: true },
];

const NAV_LINKS_AR: NavLink[] = [
  { label: 'عن', href: '#about', scroll: true },
  { label: 'المهارات', href: '#skills', scroll: true },
  { label: 'الخبرة', href: '#experience', scroll: true },
  { label: 'التعليم', href: '#education', scroll: true },
  { label: 'المشاريع', href: '#projects', scroll: true },
  { label: 'الشهادات', href: '#certifications', scroll: true },
  { label: 'التواصل', href: '#contact', scroll: true },
];

export default function Navbar({ sections }: { sections?: NavSection[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, isRTL } = useLanguage();
  const router = useRouter();

  const links =
    sections && sections.length > 0
      ? sections.map((section) => ({
          label: language === 'ar' ? section.labelAr : section.labelEn,
          href: `#${section.key}`,
          scroll: true,
        }))
      : language === 'ar'
        ? NAV_LINKS_AR
        : NAV_LINKS_EN;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavClick = (link: NavLink) => {
    setMobileOpen(false);

    const el = document.querySelector(link.href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/${link.href}`);
    }
  };

  const navLinkClass =
    'rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground xl:px-2.5';

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed left-0 right-0 top-0 z-40 transition-all duration-300',
          scrolled
            ? 'border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-xl'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <button
              onClick={() => {
                router.push('/');
              }}
              className="text-base font-semibold tracking-[0.18em] text-foreground"
            >
              {language === 'ar' ? 'أ.ف.ه' : 'AFH'}
            </button>

            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link)}
                  className={navLinkClass}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:gap-1.5 sm:px-2.5"
                aria-label="Toggle language"
              >
                <Languages className="h-3.5 w-3.5" />
                {language === 'en' ? 'عربي' : 'EN'}
              </button>

              <button
                onClick={() => {
                  if (!mounted) return;
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                }}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Toggle theme"
                disabled={!mounted}
              >
                {mounted ? (
                  theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
                ) : (
                  <span className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed inset-x-0 top-14 z-30 border-b border-border bg-background/95 shadow-lg backdrop-blur-xl md:hidden'
            )}
          >
            <nav className="flex max-h-[calc(100vh-4.5rem)] flex-col gap-1 overflow-y-auto px-4 py-3">
              {links.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    isRTL ? 'text-right' : 'text-left'
                  )}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
