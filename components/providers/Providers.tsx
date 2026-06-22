'use client';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';

export default function Providers({
  children,
  defaultTheme = 'dark',
  defaultLanguage = 'en',
}: {
  children: React.ReactNode;
  defaultTheme?: 'dark' | 'light';
  defaultLanguage?: 'en' | 'ar';
}) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider
        attribute="class"
        defaultTheme={defaultTheme}
        enableSystem={false}
        disableTransitionOnChange
      >
        <LanguageProvider initialLanguage={defaultLanguage}>
          {children}
          <Toaster />
        </LanguageProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
