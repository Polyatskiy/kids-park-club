import { uploadPuzzle } from "../admin-actions";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export default async function PuzzlesAdminPage({
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
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{t("addNewPuzzle")}</h1>

      <form action={uploadPuzzle} className="space-y-4">

        <input
          name="title"
          placeholder={t("puzzleTitlePlaceholder")}
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="category"
          placeholder={t("puzzleCategoryPlaceholder")}
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="subcategory"
          placeholder={t("puzzleSubcategoryPlaceholder")}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="file"
          name="file"
          accept="image/*"
          className="w-full border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t("uploadPuzzle")}
        </button>
      </form>

      <div className="mt-8">
        <Link href="/admin" className="text-blue-600 underline">
          {t("backToAdmin")}
        </Link>
      </div>
    </div>
  );
}

