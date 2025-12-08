export type JigsawDifficulty = 3 | 4 | 5;

export interface JigsawImage {
  id: string;
  src: string;
  label: string;
}

export interface JigsawDifficultyOption {
  gridSize: JigsawDifficulty;
  label: string;
}

export const JIGSAW_DIFFICULTIES: JigsawDifficultyOption[] = [
  { gridSize: 3, label: '3 × 3 — 9 пазлов' },
  { gridSize: 4, label: '4 × 4 — 16 пазлов' },
  { gridSize: 5, label: '5 × 5 — 25 пазлов' },
];

// Fallback static images (used when no Supabase puzzle is selected)
// Main puzzle images are loaded from Supabase
export const JIGSAW_IMAGES: JigsawImage[] = [
  { id: 'city', src: '/puzzles/warsaw.png', label: 'Warsaw (Demo)' },
];

export const DEFAULT_IMAGE_ID = 'city';
export const DEFAULT_GRID_SIZE: JigsawDifficulty = 3;

