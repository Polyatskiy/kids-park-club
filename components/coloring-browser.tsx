"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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

  // Создаем клиент Supabase (браузер)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
    return <div className="p-4 text-center text-gray-500">Загрузка...</div>;

  if (items.length === 0)
    return (
      <div className="p-6 text-center text-gray-500">
        Пока нет раскрасок. Добавьте первую!
      </div>
    );

  return (
    <div className="p-4 max-w-4xl mx-auto">
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
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

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
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-3">{title}</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/coloring/${item.slug}`}
            className="block p-2 rounded-lg border hover:shadow"
          >
            <div className="w-full h-48 bg-white rounded-lg border flex items-center justify-center overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={item.thumbnail_url ?? undefined}
                  alt={item.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="mt-2 text-center text-sm font-medium">
              {item.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
