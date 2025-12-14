import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

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
      <h1 className="text-3xl font-bold">{t("adminPanel")}</h1>

      <Link href="/admin/coloring" className="underline">
        {t("manageColoring")}
      </Link>

      <Link href="/admin/puzzles" className="underline">
        {t("managePuzzles")}
      </Link>

      <Link href="/" className="underline">
        {t("backToSite")}
      </Link>
    </div>
  );
}
