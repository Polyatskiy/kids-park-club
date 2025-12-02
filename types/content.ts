export type Coloring = {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory?: string;   // ← ДОБАВИЛИ
  filePath: string;
};


export type AudioStory = {
  id: string;
  title: string;
  slug: string;
  duration: string;
  description: string;
  audioUrl: string;
};

export type Book = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverColor: string;
  pages: { number: number; content: string; image?: string }[];
};

export type GameMeta = {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: "reaction" | "puzzle";
};
