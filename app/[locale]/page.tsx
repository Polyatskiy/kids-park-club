import { HomeTile } from "@/components/home-tile";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  setRequestLocale(validLocale);
  
  const t = await getTranslations({ locale: validLocale, namespace: "common" });
  
  return {
    title: "Kids Park Club – Coloring Pages and Games",
    description: "Free printable coloring pages, jigsaw puzzles, and fun games for kids. Educational activities and entertainment in one place.",
  };
}

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure locale is valid
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  
  // Set request locale for server components
  setRequestLocale(validLocale);
  
  // Explicitly pass locale to ensure correct translations are loaded
  const t = await getTranslations({ locale: validLocale, namespace: "common" });
  
  const tiles = [
    {
      icon: "/assets/icon-crayons.png",
      label: t("coloring"),
      href: "/coloring",
      bgColor: "rgba(155, 140, 217, 0.65)", // Purple with transparency
      glowColor: "rgba(155, 140, 217, 0.4)",
    },
    {
      icon: "/icons/puzzle.png",
      label: t("puzzles"),
      href: "/games/jigsaw/gallery",
      bgColor: "rgba(245, 200, 66, 0.65)", // Yellow with transparency
      glowColor: "rgba(245, 200, 66, 0.4)",
    },
    {
      icon: "/assets/icon-gamepad.png",
      label: t("games"),
      href: "/games",
      bgColor: "rgba(91, 168, 229, 0.65)", // Blue with transparency
      glowColor: "rgba(91, 168, 229, 0.4)",
    },
    {
      icon: "/assets/icon-star.png",
      label: t("popular"),
      href: "/popular",
      bgColor: "rgba(245, 166, 35, 0.65)", // Orange with transparency
      glowColor: "rgba(245, 166, 35, 0.4)",
    },
  ];
  return (
    <div className="min-h-screen flex items-center justify-center md:justify-end px-4 md:px-8 lg:px-12 pt-24 md:pt-0 home-tiles-container">
      {/* Tiles Grid - positioned to avoid overlapping the girl */}
      <div className="w-full max-w-[320px] md:max-w-[400px] lg:max-w-[440px] md:mr-4 lg:mr-8 xl:mr-16">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {tiles.map((tile) => (
            <HomeTile
              key={tile.href}
              icon={tile.icon}
              label={tile.label}
              href={tile.href}
              bgColor={tile.bgColor}
              glowColor={tile.glowColor}
            />
          ))}
        </div>
      </div>
        </div>
  );
}
