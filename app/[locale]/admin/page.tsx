import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export default async function AdminPage() {
  const t = await getTranslations("common.adminPanel");
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
