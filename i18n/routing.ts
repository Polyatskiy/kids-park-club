import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'pl', 'ru', 'uk'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The `localePrefix` strategy
  // 'always' means: all locales including 'en' have prefix (/en, /pl, /ru, /uk)
  // This ensures /en/... routes work correctly and don't cause 404 errors
  localePrefix: 'always'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
