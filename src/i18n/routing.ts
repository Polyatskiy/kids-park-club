import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'pl', 'uk', 'ru'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The `localePrefix` option controls when the locale prefix is shown
  // 'as-needed' means English stays at `/` and other locales use `/pl`, `/uk`, `/ru`
  localePrefix: 'as-needed'
});
