import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  getColoringList,
  getAudioStories,
  getBooks,
} from "@/lib/content-repository";

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

  // Fetch dynamic content
  const [colorings, audioStories, books] = await Promise.all([
    getColoringList(),
    getAudioStories(),
    getBooks(),
  ]);

  // Generate sitemap entries for all locales
  const entries: MetadataRoute.Sitemap = [];

  routing.locales.forEach((locale) => {
    // Add static routes
    staticRoutes.forEach((route) => {
      const url = route === "" 
        ? `${base}/${locale}` 
        : `${base}/${locale}${route}`;
      
      entries.push({
        url,
        lastModified: now,
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.8,
      });
    });

    // Add coloring pages
    colorings.forEach((coloring) => {
      entries.push({
        url: `${base}/${locale}/coloring/${coloring.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    // Add audio story pages
    audioStories.forEach((story) => {
      entries.push({
        url: `${base}/${locale}/audio-stories/${story.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    // Add book pages
    books.forEach((book) => {
      entries.push({
        url: `${base}/${locale}/books/${book.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });
  });

  return entries;
}
