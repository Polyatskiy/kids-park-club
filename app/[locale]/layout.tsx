import "../globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import dynamic from 'next/dynamic';
import { Analytics } from "@/components/analytics";
import { SuppressConsoleWarnings } from "@/components/suppress-console-warnings";
import { getMessages } from "next-intl/server";
import type { Viewport } from "next";

// Viewport configuration for mobile responsiveness
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // Support for iOS safe areas
};

// Dynamically import SpeedInsights to reduce initial bundle size
// Load it after page interaction to improve TTI (Time to Interactive)
const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((mod) => ({ default: mod.SpeedInsights }))
);

const baseUrl = "https://www.kids-park.club";
const logoUrl = `${baseUrl}/assets/logo.png`;

// Base metadata - will be overridden by page-specific generateMetadata
// This ensures Lighthouse can always find meta description in initial HTML
export const metadata: Metadata = {
  metadataBase: new URL("https://www.kids-park.club"),
  // Default fallback description - pages should override this
  description: "Free printable coloring pages, jigsaw puzzles, and fun educational games for kids. Perfect for toddlers, preschoolers, and school-age children.",
  openGraph: {
    siteName: "Kids Park Club",
    type: "website",
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
      {/* Suppress non-critical warnings from third-party scripts (Vercel Live Feedback) */}
      <SuppressConsoleWarnings />
      <Analytics />
      <Navbar />
      <main className="flex-1 relative">{children}</main>
      <Footer />
      {/* Load SpeedInsights after initial render to improve performance */}
      <SpeedInsights />
    </NextIntlClientProvider>
  );
}
