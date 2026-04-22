'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Download, Github, Mail, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProfileData } from '@/types/content';

interface HeroProps {
  profile: ProfileData | null;
}

export default function Hero({ profile }: HeroProps) {
  const { language } = useLanguage();

  const name = localizedText(profile, language, 'nameEn', 'nameAr', 'Ahmed Fouad Hashem');
  const headline = localizedText(profile, language, 'headlineEn', 'headlineAr');
  const title = localizedText(profile, language, 'titleEn', 'titleAr');
  const subtitle = localizedText(profile, language, 'subtitleEn', 'subtitleAr');
  const heroHeadline = headline || title || (profile ? '' : 'Data Analyst | Applied AI Specialist');
  const showTitle = Boolean(title && title !== heroHeadline);
  const hireLabel = localizedText(profile, language, 'ctaHireMeEn', 'ctaHireMeAr', 'Hire Me');
  const downloadLabel = localizedText(
    profile,
    language,
    'ctaDownloadCvEn',
    'ctaDownloadCvAr',
    'Download CV'
  );
  const availabilityLabel = localizedText(
    profile,
    language,
    'availabilityLabelEn',
    'availabilityLabelAr',
    'Available for work'
  );
  const profileImage = profile?.profileImage?.trim();
  const isLocalProfileImage = Boolean(profileImage?.startsWith('/'));

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
  };

  return (
    <section
      id="hero"
      className="themed-section relative flex min-h-[calc(100svh-3.5rem)] items-center justify-center overflow-hidden pt-14"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-5"
        >
          {profile?.availableForWork && (
            <motion.div variants={item} className="flex justify-center">
              <Badge variant="success" className="gap-1.5 px-3 py-1 text-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                {availabilityLabel}
              </Badge>
            </motion.div>
          )}

          {profileImage && (
            <motion.div variants={item} className="flex justify-center">
              {isLocalProfileImage ? (
                <Image
                  src={profileImage}
                  alt={name}
                  width={128}
                  height={128}
                  className="h-28 w-28 rounded-full border border-border object-cover shadow-lg shadow-primary/10 sm:h-32 sm:w-32"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImage}
                  alt={name}
                  className="h-28 w-28 rounded-full border border-border object-cover shadow-lg shadow-primary/10 sm:h-32 sm:w-32"
                />
              )}
            </motion.div>
          )}

          {name && (
            <motion.p variants={item} className="text-sm font-medium text-muted-foreground">
              {name}
            </motion.p>
          )}

          {heroHeadline && (
            <motion.h1
              variants={item}
              className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              {heroHeadline}
            </motion.h1>
          )}

          {showTitle && (
            <motion.p variants={item} className="text-base font-medium text-foreground/90 sm:text-lg">
              {title}
            </motion.p>
          )}

          {subtitle && (
            <motion.p
              variants={item}
              className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base"
            >
              {subtitle}
            </motion.p>
          )}

          <motion.div
            variants={item}
            className="flex flex-wrap items-center justify-center gap-2.5 pt-2 sm:gap-3 sm:pt-3"
          >
            {hireLabel && (
              <Button variant="gradient" size="lg" asChild>
                <a href="#contact">
                  <Mail className="h-4 w-4" />
                  {hireLabel}
                </a>
              </Button>
            )}

            {profile?.cvFile && downloadLabel && (
              <Button variant="outline" size="lg" asChild>
                <a href={profile.cvFile} download>
                  <Download className="h-4 w-4" />
                  {downloadLabel}
                </a>
              </Button>
            )}
          </motion.div>

          <motion.div
            variants={item}
            className="flex flex-wrap items-center justify-center gap-2.5 pt-2 sm:gap-3 sm:pt-3"
          >
            {profile?.github && (
              <SocialLink
                href={profile.github}
                ariaLabel="GitHub"
                icon={<Github className="h-4 w-4" />}
              />
            )}
            {profile?.linkedin && (
              <SocialLink
                href={profile.linkedin}
                ariaLabel="LinkedIn"
                icon={(
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                )}
              />
            )}
            {profile?.kaggle && (
              <SocialLink
                href={profile.kaggle}
                ariaLabel="Kaggle"
                icon={(
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.285.18.046.149.034.27-.036.352l-6.555 6.29 6.876 8.629c.08.107.095.234.031.38z" />
                  </svg>
                )}
              />
            )}
            {profile?.whatsapp && (
              <SocialLink
                href={profile.whatsapp}
                ariaLabel="WhatsApp"
                icon={<MessageCircle className="h-4 w-4" />}
              />
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function localizedText(
  profile: ProfileData | null,
  language: 'en' | 'ar',
  enKey: keyof ProfileData,
  arKey: keyof ProfileData,
  missingProfileFallback = ''
) {
  if (!profile) return missingProfileFallback;

  const primary = language === 'ar' ? profile[arKey] : profile[enKey];
  const secondary = language === 'ar' ? profile[enKey] : profile[arKey];

  return stringValue(primary) || stringValue(secondary);
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function SocialLink({
  href,
  ariaLabel,
  icon,
}: {
  href: string;
  ariaLabel: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
      aria-label={ariaLabel}
    >
      {icon}
    </a>
  );
}
