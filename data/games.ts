import { GameMeta } from "@/types/content";

export const gamesSeed: GameMeta[] = [
  {
    id: "1",
    title: "Reaction Game",
    slug: "reaction",
    description: "Click the button when it lights up!",
    type: "reaction"
  },
  {
    id: "2",
    title: "Mini Puzzle",
    slug: "puzzle",
    description: "Match pairs of pictures.",
    type: "puzzle"
  },
  {
    id: "3",
    title: "Puzzles",
    slug: "jigsaw/gallery",
    description: "Assemble puzzles from pictures.",
    type: "jigsaw"
  }
];
