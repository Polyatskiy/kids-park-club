import { supabaseServer } from "@/lib/supabaseClient";
import { Container } from "@/ui/container";
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
    <Container className="py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{item.title}</h1>
        <p className="text-sm text-gray-600">
          {item.category} • {item.subcategory}
        </p>
      </div>

      <ColoringCanvas src={imageUrl} closeHref="/coloring" />
    </Container>
  );
}
