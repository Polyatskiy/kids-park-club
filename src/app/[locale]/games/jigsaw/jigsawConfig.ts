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

/**
 * Puzzle difficulty options with BALANCED grids.
 * 
 * For good gameplay, grids should have a reasonable aspect ratio (close to square).
 * This prevents extreme stretching on mobile and desktop layouts.
 * 
 * Piece counts are chosen so that rows × cols produces a balanced grid:
 * - 9 = 3×3 (square)
 * - 16 = 4×4 (square)
 * - 25 = 5×5 (square)
 * - 48 = 6×8 (ratio 1.33, replaces old 75 which was 15×5 = ratio 3.0)
 * - 100 = 10×10 (square)
 * - 120 = 10×12 (ratio 1.2, replaces old 125 which was 25×5 = ratio 5.0)
 */
export const JIGSAW_OPTIONS: JigsawOption[] = [
  { pieces: 9, rows: 3, cols: 3 },
  { pieces: 16, rows: 4, cols: 4 },
  { pieces: 25, rows: 5, cols: 5 },
  { pieces: 48, rows: 6, cols: 8 },    // Balanced grid (was 75 = 15×5, too tall)
  { pieces: 100, rows: 10, cols: 10 },
  { pieces: 120, rows: 10, cols: 12 }, // Balanced grid (was 125 = 25×5, too tall)
];

// Fallback static images (used when no Supabase puzzle is selected)
// Main puzzle images are loaded from Supabase
export const JIGSAW_IMAGES: JigsawImage[] = [
  { id: 'city', src: '/puzzles/warsaw.png', label: 'Warsaw (Demo)' },
];

export const DEFAULT_IMAGE_ID = 'city';
export const DEFAULT_OPTION = JIGSAW_OPTIONS[0];
