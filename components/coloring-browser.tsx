"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { CarouselRow } from "@/components/carousel-row";
import { useTranslations } from "next-intl";

type ColoringItem = {
  id: number;
  title: string;
  category: string;
  subcategory: string;
  slug: string;
  file_url: string;
  thumbnail_url: string | null;
};

export default function ColoringBrowser() {
  const [items, setItems] = useState<ColoringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("common.browser");

  // Создаем клиент Supabase (браузер)
  const supabase = supabaseBrowser();

  // Загружаем раскраски
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("coloring_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setItems(data as ColoringItem[]);
      }

      setLoading(false);
    }

    load();
  }, []);

  if (loading)
    return <div className="p-4 text-center text-gray-500">{t("loading")}</div>;

  if (items.length === 0)
    return (
      <div className="p-6 text-center text-gray-500">
        {t("noColoringPages")}
      </div>
    );

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Группируем по категориям */}
      {Array.from(new Set(items.map((i) => i.category))).map((category) => (
        <CategoryBlock
          key={category}
          title={category}
          items={items.filter((i) => i.category === category)}
        />
      ))}
    </div>
  );
}

function CategoryBlock({
  title,
  items,
}: {
  title: string;
  items: ColoringItem[];
}) {
  const subcats = Array.from(new Set(items.map((i) => i.subcategory)));

  return (
    <div className="mb-10">
      <h2 className="inline-block text-2xl font-bold mb-4 px-3 py-1 rounded-xl bg-white/35 backdrop-blur-[12px] text-[#222] shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
        {title}
      </h2>

      {subcats.map((sub) => (
        <SubcategoryBlock
          key={sub}
          title={sub}
          items={items.filter((i) => i.subcategory === sub)}
        />
      ))}
    </div>
  );
}

function SubcategoryBlock({
  title,
  items,
}: {
  title: string;
  items: ColoringItem[];
}) {
  const carouselItems = items.map((item) => (
          <Link
            key={item.id}
            href={`/coloring/${item.slug}`}
            className="block p-2 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-md hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition-shadow shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
          >
            <div className="w-full relative aspect-[4/3] rounded-xl overflow-hidden bg-white/30">
              <Image
                src={item.thumbnail_url ?? "/placeholder.png"}
                alt={item.title}
                fill
                className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>

            <div
              className="mt-2 text-center text-sm font-semibold text-white"
              style={{ textShadow: "0 2px 6px rgba(0,0,0,0.25)" }}
            >
              {item.title}
            </div>
          </Link>
  ));

  return <CarouselRow title={title} items={carouselItems} />;
}
