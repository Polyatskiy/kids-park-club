import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  getItems,
  getCategories,
  getSubcategories,
  getAudioStories,
  getBooks,
} from "@/lib/content-repository";
import { getLocalizedUrl } from "@/lib/seo-utils";

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://kids-park.club";
  const now = new Date();

  // Static routes that exist for all locales
  const staticRoutes = [
    "",
    "/coloring",
    "/games",
    "/games/jigsaw/gallery",
    "/games/reaction",
    "/games/puzzle",
    "/audio-stories",
    "/books",
    "/popular",
  ];

  // Fetch dynamic content (using new schema)
  // Get items for all locales - we'll generate URLs for each locale
  const [coloringItems, puzzleItems, coloringCategories, puzzleCategories, audioStories, books] = await Promise.all([
    getItems('coloring', { locale: null }), // Get all items (will use default locale for titles, but we have IDs)
    getItems('puzzles', { locale: null }),
    getCategories('coloring', null),
    getCategories('puzzles', null),
    getAudioStories(),
    getBooks(),
  ]);

  // Generate sitemap entries for all locales
  const entries: MetadataRoute.Sitemap = [];

  routing.locales.forEach((locale) => {
    // Add static routes (using localized URLs - EN unprefixed, others prefixed)
    staticRoutes.forEach((route) => {
      const url = getLocalizedUrl(route === "" ? "/" : route, locale);
      
      entries.push({
        url,
        lastModified: now,
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.8,
      });
    });

    // Add coloring category pages (using localized URLs)
    coloringCategories.forEach((category) => {
      entries.push({
        url: `${getLocalizedUrl("/coloring", locale)}?category=${category.id}`,
        lastModified: category.createdAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

    // Add puzzle category pages (using localized URLs)
    puzzleCategories.forEach((category) => {
      entries.push({
        url: `${getLocalizedUrl("/games/jigsaw/gallery", locale)}?category=${category.id}`,
        lastModified: category.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });

    // Add coloring pages (using ID or slug, with localized URLs)
    coloringItems.forEach((item) => {
      const slug = item.slug || item.id;
      entries.push({
        url: getLocalizedUrl(`/coloring/${slug}`, locale),
        lastModified: item.updatedAt || item.createdAt,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    // Add puzzle pages (using ID or slug, with localized URLs)
    puzzleItems.forEach((item) => {
      const slug = item.slug || item.id;
      // Puzzles are accessed via jigsaw game, but we can still list them
      entries.push({
        url: getLocalizedUrl("/games/jigsaw/gallery", locale),
        lastModified: item.updatedAt || item.createdAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });

    // Add audio story pages (using localized URLs)
    audioStories.forEach((story) => {
      entries.push({
        url: getLocalizedUrl(`/audio-stories/${story.slug}`, locale),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    // Add book pages (using localized URLs)
    books.forEach((book) => {
      entries.push({
        url: getLocalizedUrl(`/books/${book.slug}`, locale),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });
  });

  return entries;
}
