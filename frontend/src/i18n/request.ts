import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export default getRequestConfig(async () => {
  // `?lang=` (set by src/proxy.ts) wins over the saved cookie, so language URLs are stable.
  const requested = (await headers()).get('x-itqan-locale') ?? (await cookies()).get('NEXT_LOCALE')?.value;
  const locale: Locale = locales.includes(requested as Locale) ? (requested as Locale) : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
