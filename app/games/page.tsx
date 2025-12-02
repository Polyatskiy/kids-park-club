import { Container } from "@/ui/container";
import { getGames } from "@/lib/content-repository";
import { GameCard } from "@/components/game-card";

export default async function GamesPage() {
  const games = await getGames();
  return (
    <Container className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Мини-игры</h1>
        <p className="text-sm text-gray-600">
          Простые игры для разогрева внимания и памяти.
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
