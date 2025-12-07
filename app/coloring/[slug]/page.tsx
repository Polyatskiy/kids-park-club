import { supabaseServer } from "@/lib/supabaseClient";
import ColoringCanvas from "@/components/coloring-canvas";
import { notFound } from "next/navigation";

type Props = {
  params: { slug: string };
};

export const dynamic = "force-dynamic";

export default async function ColoringPage({ params }: Props) {
  const { slug } = await params;
  const supabase = supabaseServer();

  // Забираем запись по slug
  const { data: item, error } = await supabase
    .from("coloring_items")
    .select("*")
    .eq("slug", slug)
    .single();

  // Если нет записи — 404
  if (!item) {
    console.error("Slug not found:", error);
    notFound();
  }

  // Use image_url field from the coloring_items table
  const imageUrl = item.image_url || null;

  if (!imageUrl) {
    console.error("Image field missing for slug:", slug);
    notFound();
  }

  return (
    <div className="coloring-page-container flex flex-col w-full overflow-hidden">
      <ColoringCanvas src={imageUrl} closeHref="/coloring" />
    </div>
  );
}
