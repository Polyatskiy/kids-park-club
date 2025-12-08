import { supabaseServer } from "./supabaseClient";
import type { Coloring, AudioStory, Book, GameMeta, PuzzleImage } from "@/types/content";
import { gamesSeed } from "@/data/games"; // игры пока локально

// --- РАЗУКРАШКИ ---

export async function getColoringList(): Promise<Coloring[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("coloring_items")
    .select("id, title, slug, category, subcategory, image_url, thumbnail_url")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getColoringList error", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    category: row.category ?? "",
    subCategory: row.subcategory ?? "",
    filePath: row.thumbnail_url || row.image_url || ""
  }));
}


export async function getColoringBySlug(slug: string): Promise<Coloring | null> {
  const list = await getColoringList();
  return list.find((c) => c.slug === slug) ?? null;
}

// --- АУДИОСКАЗКИ ---

export async function getAudioStories(): Promise<AudioStory[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("audio_stories")
    .select("id, title, slug, duration, description, audio_url")
    .order("title", { ascending: true });

  if (error) {
    console.error("getAudioStories error", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    duration: row.duration ?? "",
    description: row.description ?? "",
    audioUrl: row.audio_url
  }));
}

export async function getAudioStoryBySlug(
  slug: string
): Promise<AudioStory | null> {
  const list = await getAudioStories();
  return list.find((s) => s.slug === slug) ?? null;
}

// --- КНИГИ ---

export async function getBooks(): Promise<Book[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("books")
    .select("id, title, slug, description, cover_color, pages")
    .order("title", { ascending: true });

  if (error) {
    console.error("getBooks error", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    coverColor: row.cover_color ?? "#FFE066",
    pages: row.pages ?? []
  }));
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const list = await getBooks();
  return list.find((b) => b.slug === slug) ?? null;
}

// --- ИГРЫ ---

export async function getGames(): Promise<GameMeta[]> {
  return gamesSeed;
}

// --- ПАЗЛЫ ---

export async function getPuzzleList(): Promise<PuzzleImage[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("puzzle_items")
    .select("id, title, slug, category, subcategory, image_url, thumbnail_url")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPuzzleList error", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    category: row.category ?? "",
    subCategory: row.subcategory ?? "",
    imageUrl: row.image_url || "",
    thumbnailUrl: row.thumbnail_url || row.image_url || ""
  }));
}

export async function getPuzzleById(id: string): Promise<PuzzleImage | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("puzzle_items")
    .select("id, title, slug, category, subcategory, image_url, thumbnail_url")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("getPuzzleById error", error);
    return null;
  }

  return {
    id: String(data.id),
    title: data.title,
    slug: data.slug,
    category: data.category ?? "",
    subCategory: data.subcategory ?? "",
    imageUrl: data.image_url || "",
    thumbnailUrl: data.thumbnail_url || data.image_url || ""
  };
}

export async function getPuzzleBySlug(slug: string): Promise<PuzzleImage | null> {
  const list = await getPuzzleList();
  return list.find((p) => p.slug === slug) ?? null;
}
