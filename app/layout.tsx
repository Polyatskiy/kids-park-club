import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { GtagScript } from "@/components/gtag-script";

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const locale = headersList.get("x-locale") || routing.defaultLocale;
  
  return (
    <html lang={locale}>
      <head>
        <GtagScript />
      </head>
      <body className="min-h-screen flex flex-col app-background">
        {children}
      </body>
    </html>
  );
}

