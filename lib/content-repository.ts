import { supabaseServer } from "./supabaseClient";
import type { Category, Subcategory, Item, ContentType } from "@/types/content";
import { routing } from "@/i18n/routing";

// ============================================
// Helper: Get current locale with fallback
// ============================================
function getLocaleWithFallback(locale: string | null | undefined): string {
  const validLocale = locale && routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  return validLocale;
}

// ============================================
// Helper: Convert storage path to public URL
// ============================================
function getStoragePublicUrl(bucket: string, path: string): string {
  const supabase = supabaseServer();
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// ============================================
// CATEGORIES
// ============================================

/**
 * Get all visible categories for a content type, with translations for the given locale
 * Falls back to English if translation is missing
 */
export async function getCategories(
  type: ContentType | 'both',
  locale: string | null = null
): Promise<Category[]> {
  const targetLocale = getLocaleWithFallback(locale);
  const supabase = supabaseServer();

  // Query categories with translations
  // We use LEFT JOIN to get both current locale and English fallback
  const { data, error } = await supabase
    .from("categories")
    .select(`
      id,
      type,
      code,
      sort_order,
      is_visible,
      created_at,
      category_i18n!left (
        locale,
        title,
        description
      )
    `)
    .eq("is_visible", true)
    .in("type", type === 'both' ? ['coloring', 'puzzles', 'both'] : [type, 'both'])
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getCategories error", error);
    return [];
  }

  // Process results: prefer target locale, fallback to 'en'
  const categoriesMap = new Map<string, Category>();

  (data || []).forEach((row: any) => {
    const categoryId = String(row.id);
    
    // Find translation for target locale, fallback to 'en'
    const translations = row.category_i18n || [];
    const targetTranslation = translations.find((t: any) => t.locale === targetLocale);
    const enTranslation = translations.find((t: any) => t.locale === 'en');
    const translation = targetTranslation || enTranslation;

    if (!translation) return; // Skip if no translation at all

    categoriesMap.set(categoryId, {
      id: categoryId,
      type: row.type,
      code: row.code,
      sortOrder: row.sort_order,
      isVisible: row.is_visible,
      createdAt: new Date(row.created_at),
      title: translation.title,
      description: translation.description,
    });
  });

  return Array.from(categoriesMap.values());
}

/**
 * Get a single category by ID with translation
 */
export async function getCategoryById(
  categoryId: string,
  locale: string | null = null
): Promise<Category | null> {
  const targetLocale = getLocaleWithFallback(locale);
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("categories")
    .select(`
      id,
      type,
      code,
      sort_order,
      is_visible,
      created_at,
      category_i18n!left (
        locale,
        title,
        description
      )
    `)
    .eq("id", categoryId)
    .single();

  if (error || !data) {
    console.error("getCategoryById error", error);
    return null;
  }

  const translations = data.category_i18n || [];
  const targetTranslation = translations.find((t: any) => t.locale === targetLocale);
  const enTranslation = translations.find((t: any) => t.locale === 'en');
  const translation = targetTranslation || enTranslation;

  if (!translation) return null;

  return {
    id: String(data.id),
    type: data.type,
    code: data.code,
    sortOrder: data.sort_order,
    isVisible: data.is_visible,
    createdAt: new Date(data.created_at),
    title: translation.title,
    description: translation.description,
  };
}

/**
 * Get a single category by ID with ALL translations (for admin editing)
 */
export async function getCategoryByIdWithAllTranslations(
  categoryId: string
): Promise<{ category: Category; translations: Record<string, { title: string; description: string | null }> } | null> {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("categories")
    .select(`
      id,
      type,
      code,
      sort_order,
      is_visible,
      created_at,
      category_i18n!left (
        locale,
        title,
        description
      )
    `)
    .eq("id", categoryId)
    .single();

  if (error || !data) {
    console.error("getCategoryByIdWithAllTranslations error", error);
    return null;
  }

  const translations: Record<string, { title: string; description: string | null }> = {};
  (data.category_i18n || []).forEach((t: any) => {
    translations[t.locale] = {
      title: t.title,
      description: t.description,
    };
  });

  // Use English as fallback for the category object
  const enTranslation = translations['en'] || Object.values(translations)[0];
  if (!enTranslation) return null;

  return {
    category: {
      id: String(data.id),
      type: data.type,
      code: data.code,
      sortOrder: data.sort_order,
      isVisible: data.is_visible,
      createdAt: new Date(data.created_at),
      title: enTranslation.title,
      description: enTranslation.description,
    },
    translations,
  };
}

// ============================================
// SUBCATEGORIES
// ============================================

/**
 * Get all visible subcategories for a category, with translations
 */
export async function getSubcategories(
  categoryId: string,
  locale: string | null = null
): Promise<Subcategory[]> {
  const targetLocale = getLocaleWithFallback(locale);
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("subcategories")
    .select(`
      id,
      category_id,
      code,
      sort_order,
      is_visible,
      created_at,
      subcategory_i18n!left (
        locale,
        title,
        description
      )
    `)
    .eq("category_id", categoryId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getSubcategories error", error);
    return [];
  }

  const subcategories: Subcategory[] = [];

  (data || []).forEach((row: any) => {
    const translations = row.subcategory_i18n || [];
    const targetTranslation = translations.find((t: any) => t.locale === targetLocale);
    const enTranslation = translations.find((t: any) => t.locale === 'en');
    const translation = targetTranslation || enTranslation;

    if (!translation) return; // Skip if no translation

    subcategories.push({
      id: String(row.id),
      categoryId: String(row.category_id),
      code: row.code,
      sortOrder: row.sort_order,
      isVisible: row.is_visible,
      createdAt: new Date(row.created_at),
      title: translation.title,
      description: translation.description,
    });
  });

  return subcategories;
}

/**
 * Get a single subcategory by ID with ALL translations (for admin editing)
 */
export async function getSubcategoryByIdWithAllTranslations(
  subcategoryId: string
): Promise<{ subcategory: Subcategory; translations: Record<string, { title: string; description: string | null }> } | null> {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("subcategories")
    .select(`
      id,
      category_id,
      code,
      sort_order,
      is_visible,
      created_at,
      subcategory_i18n!left (
        locale,
        title,
        description
      )
    `)
    .eq("id", subcategoryId)
    .single();

  if (error || !data) {
    return null;
  }

  const translations: Record<string, { title: string; description: string | null }> = {};
  (data.subcategory_i18n || []).forEach((t: any) => {
    translations[t.locale] = {
      title: t.title,
      description: t.description,
    };
  });

  // Use English as fallback for the subcategory object
  const enTranslation = translations['en'] || Object.values(translations)[0];
  if (!enTranslation) return null;

  return {
    subcategory: {
      id: String(data.id),
      categoryId: String(data.category_id),
      code: data.code,
      sortOrder: data.sort_order,
      isVisible: data.is_visible,
      createdAt: new Date(data.created_at),
      title: enTranslation.title,
      description: enTranslation.description,
    },
    translations,
  };
}

/**
 * Get a single subcategory by ID with translation
 */
export async function getSubcategoryById(
  subcategoryId: string,
  locale: string | null = null
): Promise<Subcategory | null> {
  const targetLocale = getLocaleWithFallback(locale);
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("subcategories")
    .select(`
      id,
      category_id,
      code,
      sort_order,
      is_visible,
      created_at,
      subcategory_i18n!left (
        locale,
        title,
        description
      )
    `)
    .eq("id", subcategoryId)
    .single();

  if (error || !data) {
    console.error("getSubcategoryById error", error);
    return null;
  }

  const translations = data.subcategory_i18n || [];
  const targetTranslation = translations.find((t: any) => t.locale === targetLocale);
  const enTranslation = translations.find((t: any) => t.locale === 'en');
  const translation = targetTranslation || enTranslation;

  if (!translation) return null;

  return {
    id: String(data.id),
    categoryId: String(data.category_id),
    code: data.code,
    sortOrder: data.sort_order,
    isVisible: data.is_visible,
    createdAt: new Date(data.created_at),
    title: translation.title,
    description: translation.description,
  };
}

// ============================================
// ITEMS
// ============================================

/**
 * Get all published, visible items for a content type, with translations
 * Supports filtering by category, subcategory, and search
 */
export async function getItems(
  type: ContentType,
  options: {
    locale?: string | null;
    categoryId?: string;
    subcategoryId?: string;
    search?: string;
    sortBy?: 'created_at' | 'popular'; // TODO: implement popular sorting
    limit?: number;
    sinceDate?: Date; // Filter items created after this date
  } = {}
): Promise<Item[]> {
  const targetLocale = getLocaleWithFallback(options.locale);
  const supabase = supabaseServer();

  let query = supabase
    .from("items")
    .select(`
      id,
      type,
      category_id,
      subcategory_id,
      slug,
      source_path,
      thumb_path,
      width,
      height,
      status,
      is_visible,
      created_at,
      updated_at,
      item_i18n!left (
        locale,
        title,
        short_title,
        description,
        search_text
      )
    `)
    .eq("type", type)
    .eq("status", "published")
    .eq("is_visible", true);

  if (options.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options.subcategoryId) {
    query = query.eq("subcategory_id", options.subcategoryId);
  }

  // Filter by date if provided
  if (options.sinceDate) {
    query = query.gte("created_at", options.sinceDate.toISOString());
  }

  // Search: filter by title or search_text in current locale (with fallback to en)
  if (options.search) {
    // This is a simplified search - for production, consider full-text search
    // For now, we'll filter in JavaScript after fetching
    // TODO: Implement proper Postgres full-text search
  }

  // Sorting
  if (options.sortBy === 'created_at') {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false }); // Default
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getItems error", error);
    return [];
  }

  const items: Item[] = [];
  const bucket = type === 'coloring' ? 'coloring' : 'puzzles';

  (data || []).forEach((row: any) => {
    const translations = row.item_i18n || [];
    const targetTranslation = translations.find((t: any) => t.locale === targetLocale);
    const enTranslation = translations.find((t: any) => t.locale === 'en');
    const translation = targetTranslation || enTranslation;

    if (!translation) return; // Skip if no translation

    // Apply search filter if provided (simple text matching)
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const titleMatch = translation.title?.toLowerCase().includes(searchLower);
      const descMatch = translation.description?.toLowerCase().includes(searchLower);
      const searchTextMatch = translation.search_text?.toLowerCase().includes(searchLower);
      if (!titleMatch && !descMatch && !searchTextMatch) {
        return; // Skip this item
      }
    }


    items.push({
      id: String(row.id),
      type: row.type,
      categoryId: String(row.category_id),
      subcategoryId: row.subcategory_id ? String(row.subcategory_id) : null,
      slug: row.slug,
      sourcePath: row.source_path,
      thumbPath: row.thumb_path,
      width: row.width,
      height: row.height,
      status: row.status,
      isVisible: row.is_visible,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      title: translation.title,
      shortTitle: translation.short_title,
      description: translation.description,
      sourceUrl: getStoragePublicUrl(bucket, row.source_path),
      thumbUrl: row.thumb_path ? getStoragePublicUrl(bucket, row.thumb_path) : null,
    });
  });

  return items;
}

/**
 * Get a single item by ID or slug with translation
 */
export async function getItemById(
  itemId: string,
  locale: string | null = null
): Promise<Item | null> {
  const targetLocale = getLocaleWithFallback(locale);
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("items")
    .select(`
      id,
      type,
      category_id,
      subcategory_id,
      slug,
      source_path,
      thumb_path,
      width,
      height,
      status,
      is_visible,
      created_at,
      updated_at,
      item_i18n!left (
        locale,
        title,
        short_title,
        description,
        search_text
      )
    `)
    .eq("id", itemId)
    .single();

  if (error || !data) {
    console.error("getItemById error", error);
    return null;
  }

  const translations = data.item_i18n || [];
  const targetTranslation = translations.find((t: any) => t.locale === targetLocale);
  const enTranslation = translations.find((t: any) => t.locale === 'en');
  const translation = targetTranslation || enTranslation;

  if (!translation) return null;

  const bucket = data.type === 'coloring' ? 'coloring' : 'puzzles';

  return {
    id: String(data.id),
    type: data.type,
    categoryId: String(data.category_id),
    subcategoryId: data.subcategory_id ? String(data.subcategory_id) : null,
    slug: data.slug,
    sourcePath: data.source_path,
    thumbPath: data.thumb_path,
    width: data.width,
    height: data.height,
    status: data.status,
    isVisible: data.is_visible,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    title: translation.title,
    shortTitle: translation.short_title,
    description: translation.description,
    sourceUrl: getStoragePublicUrl(bucket, data.source_path),
    thumbUrl: data.thumb_path ? getStoragePublicUrl(bucket, data.thumb_path) : null,
  };
}

/**
 * Get a single item by ID with ALL translations (for admin editing)
 */
export async function getItemByIdWithAllTranslations(
  itemId: string
): Promise<{ item: Item; translations: Record<string, { title: string; shortTitle: string | null; description: string | null }> } | null> {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("items")
    .select(`
      id,
      type,
      category_id,
      subcategory_id,
      slug,
      source_path,
      thumb_path,
      width,
      height,
      status,
      is_visible,
      created_at,
      updated_at,
      item_i18n!left (
        locale,
        title,
        short_title,
        description,
        search_text
      )
    `)
    .eq("id", itemId)
    .single();

  if (error || !data) {
    console.error("getItemByIdWithAllTranslations error", error);
    return null;
  }

  const translations: Record<string, { title: string; shortTitle: string | null; description: string | null }> = {};
  (data.item_i18n || []).forEach((t: any) => {
    translations[t.locale] = {
      title: t.title,
      shortTitle: t.short_title,
      description: t.description,
    };
  });

  // Use English as fallback for the item object
  const enTranslation = translations['en'] || Object.values(translations)[0];
  if (!enTranslation) return null;

  const bucket = data.type === 'coloring' ? 'coloring' : 'puzzles';

  return {
    item: {
      id: String(data.id),
      type: data.type,
      categoryId: String(data.category_id),
      subcategoryId: data.subcategory_id ? String(data.subcategory_id) : null,
      slug: data.slug,
      sourcePath: data.source_path,
      thumbPath: data.thumb_path,
      width: data.width,
      height: data.height,
      status: data.status,
      isVisible: data.is_visible,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      title: enTranslation.title,
      shortTitle: enTranslation.shortTitle,
      description: enTranslation.description,
      sourceUrl: getStoragePublicUrl(bucket, data.source_path),
      thumbUrl: data.thumb_path ? getStoragePublicUrl(bucket, data.thumb_path) : null,
    },
    translations,
  };
}

/**
 * Get item by slug
 */
export async function getItemBySlug(
  slug: string,
  type: ContentType,
  locale: string | null = null
): Promise<Item | null> {
  const targetLocale = getLocaleWithFallback(locale);
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("items")
    .select(`
      id,
      type,
      category_id,
      subcategory_id,
      slug,
      source_path,
      thumb_path,
      width,
      height,
      status,
      is_visible,
      created_at,
      updated_at,
      item_i18n!left (
        locale,
        title,
        short_title,
        description,
        search_text
      )
    `)
    .eq("slug", slug)
    .eq("type", type)
    .single();

  if (error || !data) {
    return null;
  }

  const translations = data.item_i18n || [];
  const targetTranslation = translations.find((t: any) => t.locale === targetLocale);
  const enTranslation = translations.find((t: any) => t.locale === 'en');
  const translation = targetTranslation || enTranslation;

  if (!translation) return null;

  const bucket = type === 'coloring' ? 'coloring' : 'puzzles';

  return {
    id: String(data.id),
    type: data.type,
    categoryId: String(data.category_id),
    subcategoryId: data.subcategory_id ? String(data.subcategory_id) : null,
    slug: data.slug,
    sourcePath: data.source_path,
    thumbPath: data.thumb_path,
    width: data.width,
    height: data.height,
    status: data.status,
    isVisible: data.is_visible,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    title: translation.title,
    shortTitle: translation.short_title,
    description: translation.description,
    sourceUrl: getStoragePublicUrl(bucket, data.source_path),
    thumbUrl: data.thumb_path ? getStoragePublicUrl(bucket, data.thumb_path) : null,
  };
}

// ============================================
// LEGACY FUNCTIONS (for backward compatibility during migration)
// ============================================

import type { Coloring, PuzzleImage } from "@/types/content";
import { gamesSeed } from "@/data/games";

/**
 * Legacy: Get coloring list (maps to new Item model)
 */
export async function getColoringList(): Promise<Coloring[]> {
  const items = await getItems('coloring');
  return items.map(item => ({
    id: item.id,
    title: item.title,
    slug: item.slug || item.id,
    category: '', // Will be populated from category lookup if needed
    subCategory: '',
    filePath: item.thumbUrl || item.sourceUrl || '',
  }));
}

/**
 * Legacy: Get coloring by slug
 */
export async function getColoringBySlug(slug: string): Promise<Coloring | null> {
  const item = await getItemBySlug(slug, 'coloring');
  if (!item) return null;
  return {
    id: item.id,
    title: item.title,
    slug: item.slug || item.id,
    category: '',
    subCategory: '',
    filePath: item.thumbUrl || item.sourceUrl || '',
  };
}

/**
 * Legacy: Get puzzle list
 */
export async function getPuzzleList(): Promise<PuzzleImage[]> {
  const items = await getItems('puzzles');
  return items.map(item => ({
    id: item.id,
    title: item.title,
    slug: item.slug || item.id,
    category: '',
    subCategory: item.subcategoryId || undefined,
    imageUrl: item.sourceUrl || '',
    thumbnailUrl: item.thumbUrl || '',
  }));
}

export async function getPuzzleById(id: string): Promise<PuzzleImage | null> {
  const item = await getItemById(id);
  if (!item || item.type !== 'puzzles') return null;
  return {
    id: item.id,
    title: item.title,
    slug: item.slug || item.id,
    category: '',
    subCategory: item.subcategoryId || undefined,
    imageUrl: item.sourceUrl || '',
    thumbnailUrl: item.thumbUrl || '',
  };
}

export async function getPuzzleBySlug(slug: string): Promise<PuzzleImage | null> {
  const item = await getItemBySlug(slug, 'puzzles');
  if (!item) return null;
  return {
    id: item.id,
    title: item.title,
    slug: item.slug || item.id,
    category: '',
    subCategory: item.subcategoryId || undefined,
    imageUrl: item.sourceUrl || '',
    thumbnailUrl: item.thumbUrl || '',
  };
}

// --- ИГРЫ ---

export async function getGames() {
  return gamesSeed;
}
