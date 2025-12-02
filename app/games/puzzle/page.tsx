"use client";

import { useState } from "react";
import { Container } from "@/ui/container";

type Card = {
  id: number;
  value: string;
  opened: boolean;
  matched: boolean;
};

const values = ["🐱", "🚗", "🚀", "⭐"];

function createDeck(): Card[] {
  const base = values.flatMap((v, index) => [
    { id: index * 2, value: v, opened: false, matched: false },
    { id: index * 2 + 1, value: v, opened: false, matched: false }
  ]);
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base;
}

export default function PuzzleGamePage() {
  const [cards, setCards] = useState<Card[]>(() => createDeck());
  const [openedIds, setOpenedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const handleClick = (card: Card) => {
    if (card.opened || card.matched || openedIds.length === 2) return;

    const newCards = cards.map((c) =>
      c.id === card.id ? { ...c, opened: true } : c
    );
    setCards(newCards);
    const newOpened = [...openedIds, card.id];
    setOpenedIds(newOpened);

    if (newOpened.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newOpened.map((id) =>
        newCards.find((c) => c.id === id)
      );
      if (first && second && first.value === second.value) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id
                ? { ...c, matched: true }
                : c
            )
          );
          setOpenedIds([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first?.id || c.id === second?.id
                ? { ...c, opened: false }
                : c
            )
          );
          setOpenedIds([]);
        }, 800);
      }
    }
  };

  const allMatched = cards.every((c) => c.matched);

  const reset = () => {
    setCards(createDeck());
    setOpenedIds([]);
    setMoves(0);
  };

  return (
    <Container className="py-8 space-y-6">
      <h1 className="text-2xl font-bold">Мини-пазл</h1>
      <p className="text-sm text-gray-600">
        Открывай карточки и находи пары.
      </p>
      <div className="grid grid-cols-4 gap-3 max-w-xs">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleClick(card)}
            className={
              "h-16 rounded-2xl flex items-center justify-center text-2xl " +
              (card.matched
                ? "bg-green-200"
                : card.opened
                ? "bg-secondary"
                : "bg-white border border-gray-200")
            }
          >
            {(card.opened || card.matched) ? card.value : "?"}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-700">Ходы: {moves}</p>
      {allMatched && (
        <p className="text-lg font-semibold text-primary">
          Молодец! Ты нашёл все пары!
        </p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 rounded-2xl bg-primary font-semibold"
      >
        Сыграть ещё
      </button>
    </Container>
  );
}
