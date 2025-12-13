import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/src/i18n/routing';
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from "next";
import "../globals.css";

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
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col app-background">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex-1 relative">{children}</main>
          <Footer />
          <SpeedInsights />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
