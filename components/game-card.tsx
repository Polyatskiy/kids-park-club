import Link from "next/link";
import { Card } from "@/ui/card";
import type { GameMeta } from "@/types/content";

export function GameCard({ game }: { game: GameMeta }) {
  return (
    <Link href={`/games/${game.slug}`}>
      <Card className="hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)] cursor-pointer space-y-2 border border-white/30 bg-white/20 backdrop-blur-md">
        <h3
          className="font-semibold text-white text-lg"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.25)" }}
        >
          {game.title}
        </h3>
        <p className="text-sm text-white/90">{game.description}</p>
      </Card>
    </Link>
  );
}
