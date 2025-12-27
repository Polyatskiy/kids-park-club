// ============================================
// New Content Model Types (i18n-ready)
// ============================================

export type ContentType = 'coloring' | 'puzzles';

export type CategoryType = 'coloring' | 'puzzles' | 'both';

export type ItemStatus = 'draft' | 'published';

// Category with translations (for a specific locale)
export type Category = {
  id: string;
  type: CategoryType;
  code: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
  // i18n fields (for current locale, with fallback to en)
  title: string;
  description: string | null;
};

// Subcategory with translations (for a specific locale)
export type Subcategory = {
  id: string;
  categoryId: string;
  code: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
  // i18n fields (for current locale, with fallback to en)
  title: string;
  description: string | null;
};

// Item with translations (for a specific locale)
export type Item = {
  id: string;
  type: ContentType;
  categoryId: string;
  subcategoryId: string | null;
  slug: string | null;
  sourcePath: string; // Storage key
  thumbPath: string | null; // Storage key
  width: number | null;
  height: number | null;
  status: ItemStatus;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  // i18n fields (for current locale, with fallback to en)
  title: string;
  shortTitle: string | null;
  description: string | null;
  // Computed: public URLs (derived from storage paths)
  sourceUrl?: string;
  thumbUrl?: string | null;
};

// ============================================
// Legacy Types (for backward compatibility during migration)
// ============================================

export type Coloring = {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory?: string;
  filePath: string;
};

export type PuzzleImage = {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory?: string;
  imageUrl: string;
  thumbnailUrl: string;
};

export type GameMeta = {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: "reaction" | "puzzle" | "jigsaw" | "checkers" | "runner";
};