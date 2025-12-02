import { createClient } from "@/lib/supabaseClient";

const supabase = createClient();

// Утилита для auto-slug
function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\wа-яё0-9]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Генератор уникального slug
async function generateUniqueSlug(base: string) {
  let slug = slugify(base);
  let attempt = 1;

  while (true) {
    const { data } = await supabase
      .from("coloring")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!data) return slug;

    slug = `${slug}-${attempt}`;
    attempt++;
  }
}

export async function syncColoringItem({
  title,
  category,
  subCategory,
  image_url,
}) {
  const slug = await generateUniqueSlug(title);

  const { data, error } = await supabase.from("coloring").insert([
    {
      title,
      category,
      subCategory: subCategory || null,
      slug,
      image_url,
    },
  ]);

  if (error) throw error;
  return data[0];
}

// Удаление по недоступному файлу
export async function deleteIfMissing(id: string) {
  await supabase.from("coloring").delete().eq("id", id);
}

export async function fileExists(publicUrl: string) {
  try {
    const res = await fetch(publicUrl, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function cleanupMissingFiles() {
  const { data } = await supabase.from("coloring").select("*");

  for (const item of data) {
    const ok = await fileExists(item.image_url);
    if (!ok) {
      console.log("File missing, removing:", item.title);
      await deleteIfMissing(item.id);
    }
  }

  return true;
}
