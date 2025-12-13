import "../globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SpeedInsights } from '@vercel/speed-insights/next';

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

export const metadata: Metadata = {
  title: "Kids Park Club – Coloring Pages and Games",
  description: "Kids platform with coloring pages and mini-games.",
  openGraph: {
    title: "Kids Park Club",
    description: "Coloring pages and games in one place.",
    type: "website"
  }
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Load messages directly using the locale from params to ensure correct locale is used
  // This bypasses any potential issues with requestLocale extraction
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    // Fallback to English if locale file doesn't exist
    messages = (await import(`@/messages/${routing.defaultLocale}.json`)).default;
  }

  // Merge with English messages to ensure all keys exist (safe fallback)
  const defaultMessages = (await import(`@/messages/${routing.defaultLocale}.json`)).default;
  
  // Deep merge: use locale messages, fallback to English for missing keys
  const mergedMessages = deepMerge(defaultMessages, messages);

  return (
    <NextIntlClientProvider locale={locale} messages={mergedMessages}>
      <Navbar />
      <main className="flex-1 relative">{children}</main>
      <Footer />
      <SpeedInsights />
    </NextIntlClientProvider>
  );
}
