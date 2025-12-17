import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  setRequestLocale(validLocale);
  
  const t = await getTranslations({ locale: validLocale, namespace: "common.adminPanel" });
  return (
    <div className="p-10 flex flex-col gap-6 text-xl">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">{t("adminPanel")}</h1>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg flex flex-col gap-4">
        <Link href="/admin/categories" className="text-blue-700 hover:text-blue-900 font-semibold underline decoration-2 underline-offset-2">
          Manage Categories
        </Link>

        <Link href="/admin/items" className="text-blue-700 hover:text-blue-900 font-semibold underline decoration-2 underline-offset-2">
          Manage Items (Coloring & Puzzles)
        </Link>

        <Link href="/" className="text-blue-700 hover:text-blue-900 font-semibold underline decoration-2 underline-offset-2">
          {t("backToSite")}
        </Link>
      </div>
    </div>
  );
}
