import { Container } from "@/ui/container";
import { getGames } from "@/lib/content-repository";
import { GameCard } from "@/components/game-card";
import { BackArrow } from "@/components/back-arrow";

export default async function GamesPage() {
  const games = await getGames();
  return (
    <>
      <BackArrow />
      <Container className="pt-20 md:pt-24 pb-8 space-y-6">
        <div className="inline-flex flex-col gap-1 px-4 py-3 rounded-2xl bg-white/30 backdrop-blur-[14px] shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
          <h1 className="text-2xl md:text-3xl font-bold text-[#222]">Мини-игры</h1>
          <p className="text-sm md:text-base text-[#333]">
            Простые игры для разогрева внимания и памяти.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((g: any) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </Container>
    </>
  );
}
