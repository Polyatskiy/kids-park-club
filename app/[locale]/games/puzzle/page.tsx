"use client";

import { useState, useEffect, useCallback } from "react";
import { Container } from "@/ui/container";
import { useTranslations } from "next-intl";

type Card = {
  id: number;
  value: number;
  flipped: boolean;
  matched: boolean;
};

const EMOJIS = ["🎨", "🚀", "🌟", "🎈", "🎯", "🎪", "🎭", "🎸"];

export default function PuzzleGamePage() {
  const t = useTranslations("common.gameDetails.puzzle");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [matchAnimation, setMatchAnimation] = useState<number[]>([]);

  const initializeGame = useCallback(() => {
    const pairs = EMOJIS.map((_, index) => index).concat(EMOJIS.map((_, index) => index));
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    
    const newCards: Card[] = shuffled.map((value, index) => ({
      id: index,
      value,
      flipped: false,
      matched: false,
    }));
    
    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setGameComplete(false);
    setDisabled(false);
    setMatchAnimation([]);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handleCardClick = (cardId: number) => {
    if (disabled || cards[cardId].flipped || cards[cardId].matched) return;

    const newCards = [...cards];
    newCards[cardId].flipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setDisabled(true);
      setMoves((prev) => prev + 1);

      const [firstId, secondId] = newFlippedCards;
      const firstCard = newCards[firstId];
      const secondCard = newCards[secondId];

      if (firstCard.value === secondCard.value) {
        // Match found!
        setTimeout(() => {
          setMatchAnimation([firstId, secondId]);
          setTimeout(() => setMatchAnimation([]), 600);
          
          setCards((prev) => {
            const updated = prev.map((card) =>
              card.id === firstId || card.id === secondId
                ? { ...card, matched: true, flipped: true }
                : card
            );
            
            // Check if game is complete
            const allMatched = updated.every((card) => card.matched);
            if (allMatched) {
              setTimeout(() => setGameComplete(true), 500);
            }
            
            return updated;
          });
          
          setFlippedCards([]);
          setDisabled(false);
        }, 800);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === firstId || card.id === secondId
                ? { ...card, flipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  return (
    <Container className="pt-16 md:pt-20 pb-4">
      <div className="w-full max-w-4xl mx-auto p-3 sm:p-4">
        <div className="text-center mb-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-0.5">
            {t("pageTitle")}
          </h1>
          <p className="text-xs text-gray-600 hidden sm:block">
            {t("pageDescription")}
          </p>
        </div>

        {/* Moves counter */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-blue-900">
              {t("moves")}: <span className="text-blue-600">{moves}</span>
            </span>
          </div>
        </div>

        {/* Game board */}
        <div className="mb-2 sm:mb-3">
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5 md:gap-3 max-w-xs sm:max-w-sm md:max-w-md mx-auto">
            {cards.map((card) => {
              const isFlipped = card.flipped || card.matched;
              const isMatched = card.matched;
              const isInMatchAnimation = matchAnimation.includes(card.id);
              const emoji = EMOJIS[card.value];

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={disabled || isMatched}
                  className={`
                    relative aspect-square rounded-lg sm:rounded-xl md:rounded-2xl
                    transition-all duration-300 transform
                    ${isMatched ? "cursor-default" : "cursor-pointer"}
                    ${isMatched ? "scale-100" : "hover:scale-105 active:scale-95"}
                    ${isInMatchAnimation ? "animate-pulse scale-110" : ""}
                    ${isMatched ? "ring-2 sm:ring-4 ring-green-400 ring-offset-1 sm:ring-offset-2" : "shadow-lg"}
                  `}
                  style={{
                    perspective: "1000px",
                  }}
                >
                  {/* Card front/back */}
                  <div
                    className={`
                      absolute inset-0 rounded-lg sm:rounded-xl
                      transition-transform duration-500
                      ${isFlipped ? "rotateY-0" : "rotateY-180"}
                      ${isMatched ? "bg-gradient-to-br from-green-400 to-emerald-500" : isFlipped ? "bg-gradient-to-br from-blue-400 to-indigo-500" : "bg-gradient-to-br from-slate-100 to-slate-200"}
                      ${isMatched ? "shadow-xl" : "shadow-md"}
                      flex items-center justify-center
                      backface-hidden
                    `}
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(0deg)" : "rotateY(180deg)",
                    }}
                  >
                    {isFlipped ? (
                      <span className="text-xl sm:text-2xl md:text-3xl transform-gpu">
                        {emoji}
                      </span>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Glow effect for matched cards */}
                  {isMatched && (
                    <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-green-400 opacity-50 blur-xl animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Game complete message */}
        {gameComplete && (
          <div className="text-center mb-2">
            <div className="inline-block bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-lg p-3 sm:p-4 shadow-2xl animate-in fade-in zoom-in duration-500">
              <div className="text-2xl sm:text-3xl mb-1">
                🎉
              </div>
              <p className="text-sm sm:text-base font-bold text-white mb-1 drop-shadow-lg">
                {t("congratulations")}
              </p>
              <p className="text-xs text-white/90 font-medium">
                {t("completedIn")} {moves} {t("moves")}
              </p>
            </div>
          </div>
        )}

        {/* Play again button */}
        <div className="text-center">
          <button
            onClick={initializeGame}
            className={`
              relative inline-flex items-center justify-center gap-1.5
              px-4 sm:px-5 py-2 sm:py-2.5
              text-xs sm:text-sm font-bold text-white
              rounded-lg shadow-lg
              bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600
              hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700
              active:scale-95
              transition-all duration-200
              transform
            `}
          >
            {/* Shimmer effect */}
            <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] transform -skew-x-12" />
            
            {/* Icon */}
            <span className="relative z-10 text-base sm:text-lg">🔄</span>
            
            {/* Text */}
            <span className="relative z-10">{t("playAgain")}</span>

            {/* Glow effect */}
            <span className="absolute inset-0 rounded-lg bg-blue-400 opacity-50 blur-xl" />
          </button>
        </div>

        {/* Add custom styles */}
        <style jsx global>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%) skewX(-12deg);
            }
            100% {
              transform: translateX(200%) skewX(-12deg);
            }
          }
          
          @keyframes rotateY-180 {
            from {
              transform: rotateY(0deg);
            }
            to {
              transform: rotateY(180deg);
            }
          }
        `}</style>
      </div>
    </Container>
  );
}
