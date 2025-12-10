export interface JigsawImage {
  id: string;
  src: string;
  label: string;
}

export interface JigsawOption {
  pieces: number;
  rows: number;
  cols: number;
}

export const JIGSAW_OPTIONS: JigsawOption[] = [
  { pieces: 9, rows: 3, cols: 3 },
  { pieces: 16, rows: 4, cols: 4 },
  { pieces: 25, rows: 5, cols: 5 },
  { pieces: 75, rows: 15, cols: 5 },
  { pieces: 100, rows: 10, cols: 10 },
  { pieces: 125, rows: 25, cols: 5 },
  { pieces: 150, rows: 15, cols: 10 },
  { pieces: 200, rows: 20, cols: 10 },
];

// Fallback static images (used when no Supabase puzzle is selected)
// Main puzzle images are loaded from Supabase
export const JIGSAW_IMAGES: JigsawImage[] = [
  { id: 'city', src: '/puzzles/warsaw.png', label: 'Warsaw (Demo)' },
];

export const DEFAULT_IMAGE_ID = 'city';
export const DEFAULT_OPTION = JIGSAW_OPTIONS[0];

