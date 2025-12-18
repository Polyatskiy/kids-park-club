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
      <Card className="cursor-pointer space-y-2 hover:shadow-strong transition-shadow">
        <h3 className="font-semibold text-slate-900 text-lg">
          {getTitle()}
        </h3>
        <p className="text-sm text-muted-foreground">{getDescription()}</p>
      </Card>
    </Link>
  );
}
