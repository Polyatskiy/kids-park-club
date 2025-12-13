import { getRequestConfig } from 'next-intl/server';
import { routing } from './i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Load messages with safe fallback to English
  let messages;
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    // Fallback to English if locale file doesn't exist
    messages = (await import(`./messages/${routing.defaultLocale}.json`)).default;
  }

  // Merge with English messages to ensure all keys exist (safe fallback)
  const defaultMessages = (await import(`./messages/${routing.defaultLocale}.json`)).default;
  
  // Deep merge: use locale messages, fallback to English for missing keys
  const mergedMessages = deepMerge(defaultMessages, messages);

  return {
    locale,
    messages: mergedMessages
  };
});

// Helper function to deep merge objects
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}
