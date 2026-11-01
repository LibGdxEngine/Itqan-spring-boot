import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { IBM_Plex_Sans_Arabic, Amiri } from 'next/font/google';
import "./globals.css";
import { SITE_CONTACT, SITE_WHATSAPP_URL, SOCIAL_PROFILES } from "@/lib/site-contact";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { SITE_URL, BRAND, brandName, defaultOgImage, jsonLdHtml, LOGO_URL, ogAlternateLocale, ogLocale } from "@/lib/seo";

// Applies the saved theme (or the OS preference) before first paint to avoid a light flash.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('itqan-theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-ar',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-serif-ar',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'seo.home' });
  const brand = brandName(locale);
  const keywords = t('keywords').split('|').map((k) => k.trim()).filter(Boolean);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t('title'),
      template: `%s | ${brand}`,
    },
    description: t('description'),
    keywords,
    applicationName: brand,
    openGraph: {
      siteName: brand,
      type: 'website',
      locale: ogLocale(locale),
      alternateLocale: [ogAlternateLocale(locale)],
      url: SITE_URL,
      title: t('title'),
      description: t('description'),
      images: [defaultOgImage(locale)],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [defaultOgImage(locale).url],
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    formatDetection: { telephone: false },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRTL = locale === 'ar';
  const brand = brandName(locale);
  const t = await getTranslations({ locale, namespace: 'seo.home' });

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${SITE_URL}#organization`,
    name: brand,
    alternateName: [isRTL ? BRAND.en : BRAND.ar, 'إتقان', 'Itqan'],
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}#logo`,
      url: LOGO_URL,
      contentUrl: LOGO_URL,
      width: 1200,
      height: 1200,
      caption: brand,
    },
    image: { '@id': `${SITE_URL}#logo` },
    description: t('description'),
    knowsAbout: isRTL
      ? ['تفسير القرآن الكريم', 'تدبر القرآن', 'علوم القرآن', 'أصول التفسير', 'العقيدة', 'الفقه', 'الحديث الشريف']
      : ['Quran Tafsir', 'Quranic reflection (Tadabbur)', 'Quranic sciences', 'Usool al-Tafsir', 'Aqeedah', 'Fiqh', 'Hadith'],
    areaServed: { '@type': 'Place', name: isRTL ? 'العالم العربي' : 'Arab world' },
    availableLanguage: ['ar', 'en'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: SITE_CONTACT.whatsappNumber.replace(/\s/g, ''),
      url: SITE_WHATSAPP_URL,
      availableLanguage: ['ar', 'en'],
    },
    sameAs: SOCIAL_PROFILES,
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: brand,
    alternateName: isRTL ? BRAND.en : BRAND.ar,
    description: t('description'),
    inLanguage: ['ar', 'en'],
    publisher: { '@id': `${SITE_URL}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/courses?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`${plexArabic.variable} ${amiri.variable}`}
      // The theme script below adds "dark" before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`antialiased ${isRTL ? 'font-arabic' : ''}`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(websiteJsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <ClientProviders>{children}</ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
