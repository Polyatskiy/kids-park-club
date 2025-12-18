import { Container } from "@/ui/container";
import { getGames } from "@/lib/content-repository";
import { GameCard } from "@/components/game-card";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default async function GamesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  setRequestLocale(validLocale);
  
  const games = await getGames();
  const t = await getTranslations({ locale: validLocale, namespace: "common.pages" });
  return (
    <Container className="pt-20 md:pt-24 pb-8 space-y-6">
        <div className="inline-flex flex-col gap-1 px-4 py-3 rounded-2xl bg-white/30 backdrop-blur-[14px] shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
          <h1 className="text-2xl md:text-3xl font-bold text-[#222]">{t("miniGames")}</h1>
          <p className="text-sm md:text-base text-[#333]">
            {t("miniGamesDescription")}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((g: any) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </Container>
  );
}
