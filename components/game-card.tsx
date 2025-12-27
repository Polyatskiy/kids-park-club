"use client";

import { Link } from "@/i18n/routing";
import { GameMeta } from "@/types/content";
import { useTranslations } from "next-intl";

// Game icons/emojis
const gameIcons: Record<string, string> = {
  reaction: "⚡",
  puzzle: "🧩",
  jigsaw: "🧩",
  checkers: "♟️",
  runner: "🏃",
};

// Game gradient colors
const gameGradients: Record<string, string> = {
  reaction: "from-yellow-400 via-orange-500 to-red-500",
  puzzle: "from-purple-400 via-pink-500 to-rose-500",
  jigsaw: "from-blue-400 via-indigo-500 to-purple-500",
  checkers: "from-emerald-400 via-teal-500 to-cyan-500",
  runner: "from-sky-400 via-cyan-500 to-blue-600",
};

export function GameCard({ game }: { game: GameMeta }) {
  const t = useTranslations("common.gameDetails");
  const tPages = useTranslations("common.pages");

  const getTitle = () => {
    if (game.type === "reaction") return t("reaction.title");
    if (game.type === "puzzle") return t("puzzle.title");
    if (game.type === "jigsaw") return t("jigsaw.title");
    if (game.type === "checkers") return t("checkers.title");
    if (game.type === "runner") return t("runner.title");
    return game.title;
  };

  const getDescription = () => {
    if (game.type === "reaction") return t("reaction.description");
    if (game.type === "puzzle") return t("puzzle.description");
    if (game.type === "jigsaw") return t("jigsaw.description");
    if (game.type === "checkers") return t("checkers.description");
    if (game.type === "runner") return t("runner.description");
    return game.description;
  };

  const icon = gameIcons[game.type] || "🎮";
  const gradient = gameGradients[game.type] || "from-gray-400 via-gray-500 to-gray-600";

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl"
    >
      <div className="relative h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100">
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        
        {/* Content */}
        <div className="relative p-6 sm:p-8 flex flex-col items-center text-center h-full">
          {/* Icon */}
          <div className={`mb-4 sm:mb-6 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
            <span className="text-5xl sm:text-6xl md:text-7xl transform group-hover:scale-110 transition-transform duration-300">
              {icon}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors duration-300">
            {getTitle()}
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-gray-600 flex-grow">
            {getDescription()}
          </p>

          {/* Play button indicator */}
          <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-sm sm:text-base shadow-md group-hover:shadow-lg group-hover:from-blue-600 group-hover:to-indigo-700 transition-all duration-300 transform group-hover:scale-105">
            <span>▶ {tPages("play")}</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
      </div>
    </Link>
  );
}
