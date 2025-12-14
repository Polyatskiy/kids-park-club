"use client";

import { Link } from "@/i18n/routing";
import { Card } from "@/ui/card";
import type { GameMeta } from "@/types/content";
import { useTranslations } from "next-intl";

export function GameCard({ game }: { game: GameMeta }) {
  const t = useTranslations("common.gameDetails");
  
  // Get translation key based on game type
  const getTitle = () => {
    if (game.type === "reaction") return t("reaction.title");
    if (game.type === "puzzle") return t("puzzle.title");
    if (game.type === "jigsaw") return t("jigsaw.title");
    return game.title; // Fallback
  };
  
  const getDescription = () => {
    if (game.type === "reaction") return t("reaction.description");
    if (game.type === "puzzle") return t("puzzle.description");
    if (game.type === "jigsaw") return t("jigsaw.description");
    return game.description; // Fallback
  };
  
  return (
    <Link href={`/games/${game.slug}`}>
      <Card className="hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)] cursor-pointer space-y-2 border border-white/30 bg-white/20 backdrop-blur-md">
        <h3
          className="font-semibold text-white text-lg"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.25)" }}
        >
          {getTitle()}
        </h3>
        <p className="text-sm text-white/90">{getDescription()}</p>
      </Card>
    </Link>
  );
}
