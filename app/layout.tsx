import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import Script from 'next/script';
import Providers from '@/components/providers/Providers';
import connectDB from '@/lib/mongodb';
import SiteSettingsModel from '@/models/SiteSettings';
import { buildMetadata } from '@/lib/seo';
import { buildThemeStyle, getThemeSettings } from '@/lib/content/theme-settings';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const revalidate = 3600;

async function getSettings() {
  try {
    await connectDB();
    const settings = await SiteSettingsModel.findOne().lean();
    return settings ? JSON.parse(JSON.stringify(settings)) : null;
  } catch {
    return null;
  }
}

async function getTheme() {
  try {
    return await getThemeSettings();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, theme] = await Promise.all([getSettings(), getTheme()]);
  const gaId = settings?.analytics?.googleAnalyticsId;
  const gaEnabled = settings?.analytics?.enabled;
  const defaultLanguage = settings?.defaultLanguage === 'ar' ? 'ar' : 'en';
  const defaultTheme = settings?.defaultTheme === 'light' ? 'light' : 'dark';
  const themeStyle = theme ? buildThemeStyle(theme) : undefined;

  return (
    <html
      lang={defaultLanguage}
      dir={defaultLanguage === 'ar' ? 'rtl' : 'ltr'}
      className={`scroll-smooth ${inter.variable} ${cairo.variable}`}
      data-color-theme={theme?.colorTheme || 'default'}
      data-card-style={theme?.cardStyle || 'premium'}
      data-radius-style={theme?.radius || 'soft'}
      data-typography-scale={theme?.typographyScale || 'balanced'}
      data-section-spacing={theme?.sectionSpacing || 'normal'}
      style={themeStyle}
      suppressHydrationWarning
    >
      <head>
        {gaEnabled && gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers defaultTheme={defaultTheme} defaultLanguage={defaultLanguage}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
