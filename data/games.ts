import { GameMeta } from "@/types/content";

export const gamesSeed: GameMeta[] = [
  {
    id: "1",
    title: "Игра на реакцию",
    slug: "reaction",
    description: "Нажми на кнопку, когда она загорится!",
    type: "reaction"
  },
  {
    id: "2",
    title: "Мини-пазл",
    slug: "puzzle",
    description: "Соедини пары картинок.",
    type: "puzzle"
  },
  {
    id: "3",
    title: "Пазлы",
    slug: "jigsaw",
    description: "Собери пазл из картинок.",
    type: "jigsaw"
  }
];
