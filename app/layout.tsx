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
      <body className="min-h-screen flex flex-col app-background">
        <GtagScript />
        {children}
      </body>
    </html>
  );
}

