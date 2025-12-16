"use server";

import { supabaseServer } from "@/lib/supabaseClient";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import type { ContentType, CategoryType } from "@/types/content";

// =============================================
// Helper: Generate thumbnail
// =============================================
async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(300, 300, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer();
}

// =============================================
// CATEGORIES
// =============================================

/**
 * Create a new category with translations
 */
export async function createCategory(formData: FormData) {
  const type = formData.get("type")?.toString() as CategoryType;
  const code = formData.get("code")?.toString().trim() || null;
  const sortOrder = parseInt(formData.get("sort_order")?.toString() || "0");
  const isVisible = formData.get("is_visible")?.toString() === "true";

  // Get translations for all locales
  const translations: Record<string, { title: string; description?: string }> = {};
  for (const locale of ['en', 'pl', 'ru', 'uk']) {
    const title = formData.get(`title_${locale}`)?.toString().trim();
    if (title) {
      translations[locale] = {
        title,
        description: formData.get(`description_${locale}`)?.toString().trim() || undefined,
      };
    }
  }

  if (!type || !translations['en']) {
    throw new Error("Type and English title are required.");
  }

  const supabase = supabaseServer();

  // Create category
  const { data: category, error: catError } = await supabase
    .from("categories")
    .insert({
      type,
      code,
      sort_order: sortOrder,
      is_visible: isVisible,
    })
    .select()
    .single();

  if (catError || !category) {
    throw new Error(`Failed to create category: ${catError?.message}`);
  }

  // Create translations
  const i18nInserts = Object.entries(translations).map(([locale, trans]) => ({
    category_id: category.id,
    locale,
    title: trans.title,
    description: trans.description || null,
  }));

  if (i18nInserts.length > 0) {
    const { error: i18nError } = await supabase
      .from("category_i18n")
      .insert(i18nInserts);

    if (i18nError) {
      // Rollback: delete category if translations fail
      await supabase.from("categories").delete().eq("id", category.id);
      throw new Error(`Failed to create translations: ${i18nError.message}`);
    }
  }

  // Revalidate pages that display categories
  revalidatePath("/coloring", "page");
  revalidatePath("/games/jigsaw/gallery", "page");
  revalidateTag("categories", "max");
  revalidateTag("sitemap", "max");

  return { id: category.id };
}

/**
 * Update category
 */
export async function updateCategory(formData: FormData) {
  const categoryId = formData.get("category_id")?.toString();
  if (!categoryId) throw new Error("Category ID required");

  const type = formData.get("type")?.toString() as CategoryType;
  const code = formData.get("code")?.toString().trim() || null;
  const sortOrder = parseInt(formData.get("sort_order")?.toString() || "0");
  const isVisible = formData.get("is_visible")?.toString() === "true";

  const supabase = supabaseServer();

  // Update category
  const { error: catError } = await supabase
    .from("categories")
    .update({
      type,
      code,
      sort_order: sortOrder,
      is_visible: isVisible,
    })
    .eq("id", categoryId);

  if (catError) {
    throw new Error(`Failed to update category: ${catError.message}`);
  }

  // Update/create translations
  for (const locale of ['en', 'pl', 'ru', 'uk']) {
    const title = formData.get(`title_${locale}`)?.toString().trim();
    const description = formData.get(`description_${locale}`)?.toString().trim() || null;

    if (title) {
      const { error: i18nError } = await supabase
        .from("category_i18n")
        .upsert({
          category_id: categoryId,
          locale,
          title,
          description,
        }, {
          onConflict: "category_id,locale"
        });

      if (i18nError) {
        console.error(`Failed to update translation for ${locale}:`, i18nError);
      }
    }
  }

  // Revalidate pages that display categories
  revalidatePath("/coloring", "page");
  revalidatePath("/games/jigsaw/gallery", "page");
  revalidateTag("categories", "max");
  revalidateTag("sitemap", "max");
}

/**
 * Delete category
 */
export async function deleteCategory(formData: FormData) {
  const categoryId = formData.get("category_id")?.toString();
  if (!categoryId) throw new Error("Category ID required");

  const supabase = supabaseServer();
  // Cascade delete will handle subcategories and items
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  // Revalidate pages that display categories
  revalidatePath("/coloring", "page");
  revalidatePath("/games/jigsaw/gallery", "page");
  revalidateTag("categories", "max");
  revalidateTag("sitemap", "max");
}

// =============================================
// SUBCATEGORIES
// =============================================

/**
 * Create a new subcategory with translations
 */
export async function createSubcategory(formData: FormData) {
  const categoryId = formData.get("category_id")?.toString();
  const code = formData.get("code")?.toString().trim() || null;
  const sortOrder = parseInt(formData.get("sort_order")?.toString() || "0");
  const isVisible = formData.get("is_visible")?.toString() === "true";

  if (!categoryId) {
    throw new Error("Category ID required");
  }

  // Get translations
  const translations: Record<string, { title: string; description?: string }> = {};
  for (const locale of ['en', 'pl', 'ru', 'uk']) {
    const title = formData.get(`title_${locale}`)?.toString().trim();
    if (title) {
      translations[locale] = {
        title,
        description: formData.get(`description_${locale}`)?.toString().trim() || undefined,
      };
    }
  }

  if (!translations['en']) {
    throw new Error("English title is required.");
  }

  const supabase = supabaseServer();

  // Create subcategory
  const { data: subcategory, error: subError } = await supabase
    .from("subcategories")
    .insert({
      category_id: categoryId,
      code,
      sort_order: sortOrder,
      is_visible: isVisible,
    })
    .select()
    .single();

  if (subError || !subcategory) {
    throw new Error(`Failed to create subcategory: ${subError?.message}`);
  }

  // Create translations
  const i18nInserts = Object.entries(translations).map(([locale, trans]) => ({
    subcategory_id: subcategory.id,
    locale,
    title: trans.title,
    description: trans.description || null,
  }));

  if (i18nInserts.length > 0) {
    const { error: i18nError } = await supabase
      .from("subcategory_i18n")
      .insert(i18nInserts);

    if (i18nError) {
      await supabase.from("subcategories").delete().eq("id", subcategory.id);
      throw new Error(`Failed to create translations: ${i18nError.message}`);
    }
  }

  // Revalidate pages that display subcategories
  revalidatePath("/coloring", "page");
  revalidatePath("/games/jigsaw/gallery", "page");
  revalidateTag("subcategories", "max");
  revalidateTag("sitemap", "max");

  return { id: subcategory.id };
}

/**
 * Update subcategory
 */
export async function updateSubcategory(formData: FormData) {
  const subcategoryId = formData.get("subcategory_id")?.toString();
  if (!subcategoryId) throw new Error("Subcategory ID required");

  const code = formData.get("code")?.toString().trim() || null;
  const sortOrder = parseInt(formData.get("sort_order")?.toString() || "0");
  const isVisible = formData.get("is_visible")?.toString() === "true";

  const supabase = supabaseServer();

  // Update subcategory
  const { error: subError } = await supabase
    .from("subcategories")
    .update({
      code,
      sort_order: sortOrder,
      is_visible: isVisible,
    })
    .eq("id", subcategoryId);

  if (subError) {
    throw new Error(`Failed to update subcategory: ${subError.message}`);
  }

  // Update/create translations
  for (const locale of ['en', 'pl', 'ru', 'uk']) {
    const title = formData.get(`title_${locale}`)?.toString().trim();
    const description = formData.get(`description_${locale}`)?.toString().trim() || null;

    if (title) {
      const { error: i18nError } = await supabase
        .from("subcategory_i18n")
        .upsert({
          subcategory_id: subcategoryId,
          locale,
          title,
          description,
        }, {
          onConflict: "subcategory_id,locale"
        });

      if (i18nError) {
        console.error(`Failed to update translation for ${locale}:`, i18nError);
      }
    }
  }

  // Revalidate pages that display subcategories
  revalidatePath("/coloring", "page");
  revalidatePath("/games/jigsaw/gallery", "page");
  revalidateTag("subcategories", "max");
  revalidateTag("sitemap", "max");
}

/**
 * Delete subcategory
 */
export async function deleteSubcategory(formData: FormData) {
  const subcategoryId = formData.get("subcategory_id")?.toString();
  if (!subcategoryId) throw new Error("Subcategory ID required");

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("subcategories")
    .delete()
    .eq("id", subcategoryId);

  if (error) {
    throw new Error(`Failed to delete subcategory: ${error.message}`);
  }

  // Revalidate pages that display subcategories
  revalidatePath("/coloring", "page");
  revalidatePath("/games/jigsaw/gallery", "page");
  revalidateTag("subcategories", "max");
  revalidateTag("sitemap", "max");
}

// =============================================
// ITEMS
// =============================================

/**
 * Upload a new item (coloring or puzzle) with ID-based storage paths
 */
export async function uploadItem(formData: FormData) {
  const type = formData.get("type")?.toString() as ContentType;
  const categoryId = formData.get("category_id")?.toString();
  const subcategoryId = formData.get("subcategory_id")?.toString() || null;
  const file = formData.get("file") as File;

  if (!type || !categoryId || !file) {
    throw new Error("Type, category ID, and file are required.");
  }

  // Get translations
  const translations: Record<string, { title: string; shortTitle?: string; description?: string }> = {};
  for (const locale of ['en', 'pl', 'ru', 'uk']) {
    const title = formData.get(`title_${locale}`)?.toString().trim();
    if (title) {
      translations[locale] = {
        title,
        shortTitle: formData.get(`short_title_${locale}`)?.toString().trim() || undefined,
        description: formData.get(`description_${locale}`)?.toString().trim() || undefined,
      };
    }
  }

  if (!translations['en']) {
    throw new Error("English title is required.");
  }

  const supabase = supabaseServer();

  // Generate item ID (used in storage path)
  const itemId = randomUUID();

  // Process image
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const thumbBuffer = await generateThumbnail(fileBuffer);

  // Get image dimensions
  const metadata = await sharp(fileBuffer).metadata();
  const width = metadata.width || null;
  const height = metadata.height || null;

  // Determine file extensions
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const sourceExt = ext === "jpg" || ext === "jpeg" ? "jpg" : "png";

  // Storage paths: ID-based, language-independent
  const bucket = type === 'coloring' ? 'coloring' : 'puzzles';
  const sourcePath = `${type}/${categoryId}/${subcategoryId || 'uncategorized'}/${itemId}/source.${sourceExt}`;
  const thumbPath = `${type}/${categoryId}/${subcategoryId || 'uncategorized'}/${itemId}/thumb.webp`;

  // Upload files
  const { error: sourceError } = await supabase.storage
    .from(bucket)
    .upload(sourcePath, fileBuffer, {
      contentType: file.type || `image/${sourceExt}`,
      upsert: false,
    });

  if (sourceError) {
    throw new Error(`Failed to upload source image: ${sourceError.message}`);
  }

  const { error: thumbError } = await supabase.storage
    .from(bucket)
    .upload(thumbPath, thumbBuffer, {
      contentType: "image/webp",
      upsert: false,
    });

  if (thumbError) {
    // Cleanup source if thumbnail fails
    await supabase.storage.from(bucket).remove([sourcePath]);
    throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);
  }

  // Create item record
  const { data: item, error: itemError } = await supabase
    .from("items")
    .insert({
      id: itemId,
      type,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      slug: null, // Can be set later if needed
      source_path: sourcePath,
      thumb_path: thumbPath,
      width,
      height,
      status: 'published',
      is_visible: true,
    })
    .select()
    .single();

  if (itemError || !item) {
    // Cleanup storage
    await supabase.storage.from(bucket).remove([sourcePath, thumbPath]);
    throw new Error(`Failed to create item: ${itemError?.message}`);
  }

  // Create translations
  const i18nInserts = Object.entries(translations).map(([locale, trans]) => ({
    item_id: itemId,
    locale,
    title: trans.title,
    short_title: trans.shortTitle || null,
    description: trans.description || null,
    search_text: `${trans.title} ${trans.description || ''}`.trim() || null,
  }));

  if (i18nInserts.length > 0) {
    const { error: i18nError } = await supabase
      .from("item_i18n")
      .insert(i18nInserts);

    if (i18nError) {
      // Rollback: delete item and storage
      await supabase.from("items").delete().eq("id", itemId);
      await supabase.storage.from(bucket).remove([sourcePath, thumbPath]);
      throw new Error(`Failed to create translations: ${i18nError.message}`);
    }
  }

  // Revalidate item detail page and listing pages
  // Use item type and slug to determine correct path
  const slug = item.slug || itemId;
  const itemPath = type === 'coloring' ? `/coloring/${slug}` : `/games/jigsaw/gallery`;
  revalidatePath(itemPath, "page");
  revalidatePath("/coloring", "page");
  revalidatePath("/games/jigsaw/gallery", "page");
  revalidateTag("items", "max");
  revalidateTag("sitemap", "max");

  return { id: itemId };
}

/**
 * Update item
 */
export async function updateItem(formData: FormData) {
  const itemId = formData.get("item_id")?.toString();
  if (!itemId) throw new Error("Item ID required");

  const categoryId = formData.get("category_id")?.toString();
  const subcategoryId = formData.get("subcategory_id")?.toString() || null;
  const file = formData.get("file") as File | null;

  const supabase = supabaseServer();

  // Get current item to know type and paths
  const { data: currentItem, error: fetchError } = await supabase
    .from("items")
    .select("type, source_path, thumb_path, slug")
    .eq("id", itemId)
    .single();

  if (fetchError || !currentItem) {
    throw new Error("Item not found");
  }

  const bucket = currentItem.type === 'coloring' ? 'coloring' : 'puzzles';

  let sourcePath = currentItem.source_path;
  let thumbPath = currentItem.thumb_path;
  let width = null;
  let height = null;

  // If file was replaced, upload new files
  if (file && file.size > 0) {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const thumbBuffer = await generateThumbnail(fileBuffer);
    const metadata = await sharp(fileBuffer).metadata();
    width = metadata.width || null;
    height = metadata.height || null;

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const sourceExt = ext === "jpg" || ext === "jpeg" ? "jpg" : "png";

    // Keep same path structure (ID-based)
    sourcePath = sourcePath.replace(/source\.(png|jpg)$/, `source.${sourceExt}`);
    thumbPath = thumbPath.replace(/thumb\.webp$/, "thumb.webp");

    // Upload new files
    const { error: sourceError } = await supabase.storage
      .from(bucket)
      .upload(sourcePath, fileBuffer, { upsert: true });

    if (sourceError) {
      throw new Error(`Failed to upload source: ${sourceError.message}`);
    }

    const { error: thumbError } = await supabase.storage
      .from(bucket)
      .upload(thumbPath, thumbBuffer, { upsert: true });

    if (thumbError) {
      throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);
    }
  }

  // Update item
  const { error: updateError } = await supabase
    .from("items")
    .update({
      category_id: categoryId,
      subcategory_id: subcategoryId,
      source_path: sourcePath,
      thumb_path: thumbPath,
      width,
      height,
    })
    .eq("id", itemId);

  if (updateError) {
    throw new Error(`Failed to update item: ${updateError.message}`);
  }

  // Update/create translations
  for (const locale of ['en', 'pl', 'ru', 'uk']) {
    const title = formData.get(`title_${locale}`)?.toString().trim();
    const shortTitle = formData.get(`short_title_${locale}`)?.toString().trim() || null;
    const description = formData.get(`description_${locale}`)?.toString().trim() || null;

    if (title) {
      const searchText = `${title} ${description || ''}`.trim() || null;

      const { error: i18nError } = await supabase
        .from("item_i18n")
        .upsert({
          item_id: itemId,
          locale,
          title,
          short_title: shortTitle,
          description,
          search_text: searchText,
        }, {
          onConflict: "item_id,locale"
        });

      if (i18nError) {
        console.error(`Failed to update translation for ${locale}:`, i18nError);
      }
    }
  }

  // Revalidate item detail page and listing pages
  // Use current item type and slug to determine correct path
  if (currentItem) {
    const slug = currentItem.slug || itemId;
    const itemPath = currentItem.type === 'coloring' ? `/coloring/${slug}` : `/games/jigsaw/gallery`;
    revalidatePath(itemPath, "page");
  }
  revalidatePath("/coloring", "page");
  revalidatePath("/games/jigsaw/gallery", "page");
  revalidateTag("items", "max");
  revalidateTag("sitemap", "max");
}

/**
 * Delete item
 */
export async function deleteItem(formData: FormData) {
  const itemId = formData.get("item_id")?.toString();
  if (!itemId) throw new Error("Item ID required");

  const supabase = supabaseServer();

  // Get item to find storage paths
  const { data: item, error: fetchError } = await supabase
    .from("items")
    .select("type, source_path, thumb_path")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    throw new Error("Item not found");
  }

  const bucket = item.type === 'coloring' ? 'coloring' : 'puzzles';

  // Delete storage files
  const pathsToDelete = [item.source_path];
  if (item.thumb_path) {
    pathsToDelete.push(item.thumb_path);
  }

  await supabase.storage.from(bucket).remove(pathsToDelete);

  // Delete item (cascade will delete translations)
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw new Error(`Failed to delete item: ${error.message}`);
  }

  // Revalidate listing pages and sitemap
  revalidatePath("/coloring", "page");
  revalidatePath("/games/jigsaw/gallery", "page");
  revalidateTag("items", "max");
  revalidateTag("sitemap", "max");
}

// =============================================
// GET TRANSLATIONS (for editing forms)
// =============================================

/**
 * Get category with all translations (server action)
 */
export async function getCategoryTranslations(categoryId: string) {
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
    console.error("getCategoryTranslations error", error);
    return null;
  }

  const translations: Record<string, { title: string; description: string | null }> = {};
  (data.category_i18n || []).forEach((t: any) => {
    translations[t.locale] = {
      title: t.title,
      description: t.description,
    };
  });

  return translations;
}

/**
 * Get subcategory with all translations (server action)
 */
export async function getSubcategoryTranslations(subcategoryId: string) {
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
    console.error("getSubcategoryTranslations error", error);
    return null;
  }

  const translations: Record<string, { title: string; description: string | null }> = {};
  (data.subcategory_i18n || []).forEach((t: any) => {
    translations[t.locale] = {
      title: t.title,
      description: t.description,
    };
  });

  return translations;
}

/**
 * Get item with all translations (server action)
 */
export async function getItemTranslations(itemId: string) {
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
    console.error("getItemTranslations error", error);
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

  return translations;
}
