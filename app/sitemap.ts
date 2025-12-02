import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://example.com";
  return [
    { url: base, lastModified: new Date() },
    { url: base + "/coloring", lastModified: new Date() },
    { url: base + "/audio-stories", lastModified: new Date() },
    { url: base + "/books", lastModified: new Date() },
    { url: base + "/games", lastModified: new Date() }
  ];
}
