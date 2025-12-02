import Link from "next/link";
import { Card } from "@/ui/card";
import type { GameMeta } from "@/types/content";

export function GameCard({ game }: { game: GameMeta }) {
  return (
    <Link href={`/games/${game.slug}`}>
      <Card className="hover:shadow-md cursor-pointer space-y-2">
        <h3 className="font-semibold text-gray-900">{game.title}</h3>
        <p className="text-sm text-gray-600">{game.description}</p>
      </Card>
    </Link>
  );
}
