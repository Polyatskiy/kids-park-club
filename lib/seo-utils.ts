import { routing } from "@/i18n/routing";

const base = "https://www.kids-park.club";

/**
 * Generate URL for a locale, with EN being unprefixed
 */
export function getLocalizedUrl(path: string, locale: string): string {
  // EN should be unprefixed, others prefixed
  if (locale === routing.defaultLocale) {
    return `${base}${path}`;
  }
  return `${base}/${locale}${path}`;
}

/**
 * Generate hreflang URLs for all locales
 */
export function getHreflangUrls(path: string): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const locale of routing.locales) {
    urls[locale] = getLocalizedUrl(path, locale);
  }
  return urls;
}

/**
 * Generate canonical URL for current locale
 */
export function getCanonicalUrl(path: string, locale: string): string {
  return getLocalizedUrl(path, locale);
}
