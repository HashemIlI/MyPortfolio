'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProfileData } from '@/types/content';

interface FooterProps {
  profile: ProfileData | null;
  footerTextEn?: string;
  footerTextAr?: string;
}

export default function Footer({ profile, footerTextEn, footerTextAr }: FooterProps) {
  const { language } = useLanguage();

  const footerText = language === 'ar'
    ? (footerTextAr || `© ${new Date().getFullYear()} أحمد فؤاد هاشم. جميع الحقوق محفوظة.`)
    : (footerTextEn || `© ${new Date().getFullYear()} Ahmed Fouad Hashem. All rights reserved.`);

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center">{footerText}</p>

          <div className="flex items-center gap-4">
            {profile?.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            )}
            {profile?.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                LinkedIn
              </a>
            )}
            {profile?.kaggle && (
              <a
                href={profile.kaggle}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Kaggle
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
