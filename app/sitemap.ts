import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
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

  // Generate sitemap entries for all locales
  const entries: MetadataRoute.Sitemap = [];

  routing.locales.forEach((locale) => {
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
  });

  return entries;
}
