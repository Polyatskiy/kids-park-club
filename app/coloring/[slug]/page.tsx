import { supabaseServer } from "@/lib/supabaseClient";
import ColoringCanvas from "@/components/coloring-canvas";
import { notFound } from "next/navigation";

type Props = {
  params: {
    slug: string;
  };
};

export const dynamic = "force-dynamic";

export default async function ColoringPage({ params }: Props) {
  const supabase = supabaseServer();

  // Забираем запись по slug
  const { data: item, error } = await supabase
    .from("coloring_items")
    .select("*")
    .eq("slug", params.slug)
    .single();

  // Если нет записи — 404
  if (!item) {
    console.error("Slug not found:", error);
    notFound();
  }

  // -------------------------------
  // 👉 ВАЖНО: выбираем правильное поле
  // -------------------------------

  const imageUrl =
    item.image_url ||
    item.url || // если всё же существует
    null;

  if (!imageUrl) {
    console.error("Image field missing for slug:", params.slug);
    notFound();
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] overflow-hidden">
      <ColoringCanvas src={imageUrl} closeHref="/coloring" />
    </div>
  );
}
