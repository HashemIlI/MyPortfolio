import type { Metadata } from 'next';

type GlobalSeoSettings = {
  siteTitleEn?: string;
  siteTitleAr?: string;
  defaultMetaTitleEn?: string;
  defaultMetaTitleAr?: string;
  siteNameEn?: string;
  siteNameAr?: string;
  defaultMetaDescriptionEn?: string;
  defaultMetaDescriptionAr?: string;
  siteDescriptionEn?: string;
  siteDescriptionAr?: string;
  siteKeywords?: string[];
  ogTitleEn?: string;
  ogTitleAr?: string;
  ogDescriptionEn?: string;
  ogDescriptionAr?: string;
  ogImage?: string;
  favicon?: string;
  defaultLanguage?: 'en' | 'ar';
};

type PageSeoInput = {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
};

export function buildMetadata(
  settings?: GlobalSeoSettings | null,
  pageSeo?: PageSeoInput
): Metadata {
  const isArabic = settings?.defaultLanguage === 'ar';

  const title =
    pageSeo?.metaTitle ||
    (isArabic
      ? settings?.defaultMetaTitleAr || settings?.siteTitleAr || settings?.siteNameAr
      : settings?.defaultMetaTitleEn || settings?.siteTitleEn || settings?.siteNameEn) ||
    'Ahmed Fouad Hashem';

  const description =
    pageSeo?.metaDescription ||
    (isArabic
      ? settings?.defaultMetaDescriptionAr || settings?.siteDescriptionAr
      : settings?.defaultMetaDescriptionEn || settings?.siteDescriptionEn) ||
    'Portfolio of Ahmed Fouad Hashem, Data Analyst and Applied AI Specialist.';

  const keywords =
    pageSeo?.metaKeywords?.length
      ? pageSeo.metaKeywords
      : settings?.siteKeywords?.length
        ? settings.siteKeywords
        : ['Data Analyst', 'Machine Learning', 'AI', 'Python'];

  const ogTitle =
    pageSeo?.metaTitle || (isArabic ? settings?.ogTitleAr : settings?.ogTitleEn) || title;
  const ogDescription =
    pageSeo?.metaDescription ||
    (isArabic ? settings?.ogDescriptionAr : settings?.ogDescriptionEn) ||
    description;
  const ogImage = pageSeo?.ogImage || settings?.ogImage || '';

  return {
    title,
    description,
    keywords,
    openGraph: {
      type: 'website',
      locale: isArabic ? 'ar_EG' : 'en_US',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : [],
    },
    icons: settings?.favicon
      ? {
          icon: settings.favicon,
          shortcut: settings.favicon,
          apple: settings.favicon,
        }
      : undefined,
  };
}
