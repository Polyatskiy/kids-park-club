"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter, routing } from "@/i18n/routing";

const LOCALE_NAMES: Record<string, string> = {
  en: "EN",
  pl: "PL",
  ru: "RU",
  uk: "UA", // Display "UA" for Ukrainian to avoid confusion with UK
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;

    // CRITICAL: Always use window.location.pathname to get the ACTUAL current URL
    // This includes any stacked locale prefixes that need to be removed
    if (typeof window === 'undefined') return;
    
    const currentFullPath = window.location.pathname;
    
    // Split the path into segments - this is the most reliable way to handle stacked locales
    const segments = currentFullPath.split('/').filter(Boolean);
    
    // Create a Set for efficient locale lookup
    const localeSet = new Set(routing.locales);
    
    // Find the first non-locale segment index
    // Remove ALL consecutive locale segments from the beginning
    let firstNonLocaleIndex = segments.length; // Default: all segments are locales (root path)
    for (let i = 0; i < segments.length; i++) {
      if (!localeSet.has(segments[i] as any)) {
        firstNonLocaleIndex = i;
        break;
      }
    }
    
    // Get all segments after the locale prefixes
    const cleanSegments = segments.slice(firstNonLocaleIndex);
    
    // Reconstruct the clean path
    const cleanPath = cleanSegments.length > 0 
      ? '/' + cleanSegments.join('/')
      : '/';

    // Build new path with new locale
    // With 'as-needed' strategy: EN has no prefix, others have prefix
    let newPath: string;
    if (newLocale === routing.defaultLocale) {
      // Default locale (EN): no prefix
      newPath = cleanPath;
    } else {
      // Other locales: add prefix
      newPath = cleanPath === '/' ? `/${newLocale}` : `/${newLocale}${cleanPath}`;
    }

    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    
    // CRITICAL: Use window.location.href to force a full page navigation
    // This ensures the page actually reloads with the new locale, triggering
    // server-side rendering with the correct locale from the URL
    window.location.href = newPath;
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        className="peer block w-full appearance-none rounded-full border border-border bg-surface px-3 py-2 pr-9 text-xs md:text-sm font-medium text-slate-900 shadow-soft hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer min-h-[40px]"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc} className="bg-surface text-slate-900">
            {LOCALE_NAMES[loc] || loc.toUpperCase()}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 peer-focus-visible:text-slate-700">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
