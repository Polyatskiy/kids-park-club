import { uploadItem } from "../admin-actions";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export default async function NewItemPage({
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
      <h1 className="text-2xl font-semibold mb-4">{t("addNewColoring")}</h1>

      <form action={uploadItem} className="space-y-4">

        <input
          name="title"
          placeholder={t("titlePlaceholder")}
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="category"
          placeholder={t("categoryPlaceholder")}
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="subcategory"
          placeholder={t("subcategoryPlaceholder")}
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
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {t("upload")}
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
