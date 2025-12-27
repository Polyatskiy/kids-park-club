import { Container } from "@/ui/container";
import { getGames } from "@/lib/content-repository";
import { GameCard } from "@/components/game-card";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { getCanonicalUrl, getHreflangUrls } from "@/lib/seo-utils";

export const revalidate = 3600; // Revalidate every hour

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
  const t = await getTranslations({ locale: validLocale, namespace: "common.pages" });
  
  const path = "/games";
  const url = getCanonicalUrl(path, validLocale);
  const title = t("miniGames") || "Mini Games";
  const description = t("miniGamesDescription") || "Simple games to warm up attention and memory.";
  
  const alternateUrls = getHreflangUrls(path);
  
  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...alternateUrls,
        'x-default': getCanonicalUrl(path, routing.defaultLocale),
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: validLocale,
      alternateLocale: routing.locales.filter(l => l !== validLocale),
    },
  };
  
  return metadata;
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function GamesPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  
  setRequestLocale(validLocale);
  const games = await getGames();
  const t = await getTranslations({ locale: validLocale, namespace: "common.pages" });

  return (
    <Container className="pt-16 md:pt-20 pb-12">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            {t("miniGames")}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            {t("miniGamesDescription")}
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {games.map((game: any) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </Container>
  );
}
