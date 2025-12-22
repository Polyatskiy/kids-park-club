import { GtagScript } from "@/components/gtag-script";
import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Get locale from next-intl (handles all the routing logic)
  let locale: string;
  try {
    locale = await getLocale();
  } catch {
    locale = routing.defaultLocale;
  }
  
  // Ensure locale is valid
  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  
  return (
    <html lang={locale}>
      <head>
        {/* Static fallback meta description for Lighthouse & basic SEO.
            Page-level metadata from the App Router will add/override
            more specific descriptions as needed. */}
        <meta
          name="description"
          content="Discover free printable coloring pages, puzzles and fun games for kids on Kids Park Club."
        />
        {/* DNS prefetch and preconnect for critical external resources */}
        <link rel="dns-prefetch" href="https://www.supabase.co" />
        <link rel="preconnect" href="https://vliqitzuwqwpieyjakoy.supabase.co" crossOrigin="anonymous" />
        {/* Note: logo.png preload removed - it's not used immediately on page load */}
      </head>
      <body className="min-h-screen flex flex-col">
        <GtagScript />
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-44 -left-44 h-[640px] w-[640px] rounded-full bg-white/40 blur-3xl" />
            <div className="absolute top-6 right-[-260px] h-[720px] w-[720px] rounded-full bg-white/28 blur-3xl" />
            <div className="absolute bottom-[-320px] left-[8%] h-[820px] w-[980px] rounded-full bg-white/22 blur-3xl" />
            <div className="absolute bottom-[-240px] right-[4%] h-[520px] w-[620px] rounded-full bg-white/16 blur-3xl" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-white/10" />
          <div className="relative">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

