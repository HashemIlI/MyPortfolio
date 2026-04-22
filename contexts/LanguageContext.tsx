'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  isRTL: boolean;
  t: (en: string, ar: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  toggleLanguage: () => {},
  isRTL: false,
  t: (en) => en,
});

export function LanguageProvider({
  children,
  initialLanguage = 'en',
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('portfolio-lang');
      if (saved === 'ar' || saved === 'en') setLanguage(saved);
    } catch {
      // Ignore unavailable or blocked storage.
    }
  }, [initialLanguage]);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'en' ? 'ar' : 'en';
      try {
        localStorage.setItem('portfolio-lang', next);
      } catch {
        // Ignore unavailable or blocked storage.
      }
      return next;
    });
  };

  const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, isRTL: language === 'ar', t }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language} suppressHydrationWarning>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
