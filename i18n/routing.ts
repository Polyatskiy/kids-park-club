import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'pl', 'ru', 'uk'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The `localePrefix` strategy
  // 'as-needed' means: default locale (en) has no prefix, others have prefix
  // EN: /coloring (no prefix)
  // PL/RU/UK: /pl/coloring, /ru/coloring, /uk/coloring (with prefix)
  localePrefix: 'as-needed'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
