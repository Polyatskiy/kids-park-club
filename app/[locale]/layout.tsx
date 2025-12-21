import "../globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@/components/analytics";
import { getMessages } from "next-intl/server";

const baseUrl = "https://www.kids-park.club";
const logoUrl = `${baseUrl}/assets/logo.png`;

export const metadata: Metadata = {
  title: "Kids Park Club – Coloring Pages and Games",
  description: "Kids platform with coloring pages and mini-games.",
  openGraph: {
    title: "Kids Park Club",
    description: "Coloring pages and games in one place.",
    type: "website",
    url: baseUrl,
    siteName: "Kids Park Club",
    images: [
      {
        url: logoUrl,
        width: 1200,
        height: 630,
        alt: "Kids Park Club Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kids Park Club",
    description: "Coloring pages and games in one place.",
    images: [logoUrl],
  },
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

  // Use next-intl's getMessages which handles fallbacks properly
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Analytics />
      <Navbar />
      <main className="flex-1 relative">{children}</main>
      <Footer />
      <SpeedInsights />
    </NextIntlClientProvider>
  );
}
