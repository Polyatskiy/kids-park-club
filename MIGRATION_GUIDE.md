# Content Model Migration Guide

## Overview

The content model has been redesigned with a normalized i18n structure that supports:
- Language-independent storage paths (ID-based, never using display names)
- Full translation support for categories, subcategories, and items
- Shared schema for both coloring pages and puzzles
- Scalable structure that supports adding new locales easily

## Database Schema

### New Tables

1. **categories** - Main category table
   - `id` (UUID)
   - `type` ('coloring' | 'puzzles' | 'both')
   - `code` (optional stable string)
   - `sort_order`, `is_visible`, timestamps

2. **category_i18n** - Category translations
   - `category_id`, `locale`, `title`, `description`

3. **subcategories** - Subcategory table
   - `id`, `category_id`, `code`, `sort_order`, `is_visible`, timestamps

4. **subcategory_i18n** - Subcategory translations
   - `subcategory_id`, `locale`, `title`, `description`

5. **items** - Shared table for coloring and puzzles
   - `id`, `type`, `category_id`, `subcategory_id`
   - `slug` (optional, language-independent)
   - `source_path`, `thumb_path` (storage keys, ID-based)
   - `width`, `height`, `status`, `is_visible`, timestamps

6. **item_i18n** - Item translations
   - `item_id`, `locale`, `title`, `short_title`, `description`, `search_text`

### Storage Structure

Files are stored with ID-based paths:
```
coloring/<categoryId>/<subCategoryId>/<itemId>/source.png
coloring/<categoryId>/<subCategoryId>/<itemId>/thumb.webp
puzzles/<categoryId>/<subCategoryId>/<itemId>/source.jpg
puzzles/<categoryId>/<subCategoryId>/<itemId>/thumb.webp
```

**Never use display names in storage paths!**

## Migration Steps

### 1. Run SQL Migration

Execute the migration file in Supabase:
```sql
-- Run: supabase/migrations/001_content_i18n_schema.sql
```

This will:
- Create all new tables
- Set up indexes for performance
- Configure RLS policies (public read, admin write)
- Create updated_at triggers

### 2. Create Storage Buckets

Ensure you have storage buckets:
- `coloring` (or use `kids-content` with prefix)
- `puzzles` (or use `kids-content` with prefix)

### 3. Migrate Existing Data (Optional)

If you have existing data, you'll need to:
1. Create categories and subcategories in the new schema
2. Migrate items with their translations
3. Move storage files to the new ID-based structure

**Note:** The system is designed for a fresh start, so backward compatibility is not included.

## Admin Workflow

### Creating Categories

1. Go to `/admin/categories`
2. Click "Create New Category"
3. Fill in:
   - Type (coloring/puzzles/both)
   - Code (optional stable identifier)
   - Sort order
   - Visibility
4. Add translations for all locales (EN is required)
5. Click "Create"

### Creating Subcategories

1. In the category management page, create subcategories
2. Link to a parent category
3. Add translations for all locales

### Uploading Items

1. Go to `/admin/items`
2. Click "Upload New Item"
3. Select type (coloring or puzzles)
4. Choose category and subcategory
5. Upload image file
6. Add translations (EN required, others optional)
7. System automatically:
   - Generates item ID
   - Stores file with ID-based path
   - Creates database records
   - Generates thumbnail

### Editing Translations

- All admin forms have translation tabs (EN/PL/RU/UK)
- You can add/edit translations later
- Missing translations fall back to English

## Public Site Behavior

### Locale Switching

- UI labels come from `next-intl` messages (unchanged)
- Content titles (categories/subcategories/items) come from DB i18n tables
- If a translation is missing, English is used as fallback
- The app never crashes due to missing translations

### Querying Content

The `content-repository.ts` provides functions:
- `getCategories(type, locale)` - Get categories with translations
- `getSubcategories(categoryId, locale)` - Get subcategories
- `getItems(type, options)` - Get items with filtering/search
- `getItemById(id, locale)` - Get single item
- `getItemBySlug(slug, type, locale)` - Get item by slug

All functions:
- Accept locale parameter
- Fall back to English if translation missing
- Return translated titles from DB

### Routes

- Coloring pages: `/coloring/[slug]` (slug can be ID or slug)
- Puzzle gallery: `/games/jigsaw/gallery`
- Both use the new schema and display translated titles

## Key Features

### 1. Language-Independent Storage

✅ Storage paths use IDs only:
```
coloring/abc123/def456/ghi789/source.png
```

❌ Never use display names:
```
coloring/Animals/Cats/sunrise.png  // WRONG!
```

### 2. Translation Fallback

- Always falls back to English if translation missing
- No crashes or errors
- Graceful degradation

### 3. Scalable Locale Support

To add a new locale:
1. Add locale to `routing.locales` in `i18n/routing.ts`
2. Add translation rows in `*_i18n` tables
3. No file moves needed!

### 4. Search Support

- Search works per locale
- Uses `item_i18n.title` and `item_i18n.search_text`
- Can be extended with Postgres full-text search

## Files Changed

### New Files
- `supabase/migrations/001_content_i18n_schema.sql` - Database schema
- `app/[locale]/admin/categories/page.tsx` - Category management
- `app/[locale]/admin/categories/category-manager.tsx` - Category UI
- `app/[locale]/admin/items/page.tsx` - Item management
- `app/[locale]/admin/items/item-manager.tsx` - Item UI
- `app/[locale]/admin/admin-actions-i18n.ts` - New admin actions

### Updated Files
- `types/content.ts` - New type definitions
- `lib/content-repository.ts` - i18n queries with fallback
- `components/coloring-browser.tsx` - Uses new schema
- `components/puzzle-browser.tsx` - Uses new schema
- `app/sitemap.ts` - Updated for new model
- `app/[locale]/coloring/[slug]/page.tsx` - Uses new schema

## Testing Checklist

- [ ] Run SQL migration
- [ ] Create a category with translations
- [ ] Create a subcategory
- [ ] Upload an item (coloring)
- [ ] Upload an item (puzzle)
- [ ] Verify storage paths are ID-based
- [ ] Switch locales and verify translations
- [ ] Test missing translation fallback (remove a translation, verify English shows)
- [ ] Test search functionality
- [ ] Verify sitemap includes all items
- [ ] Test public pages display correctly

## Troubleshooting

### Items not showing
- Check `status = 'published'` and `is_visible = true`
- Verify translations exist (at least English)
- Check RLS policies allow public read

### Translations not working
- Verify translation rows exist in `*_i18n` tables
- Check locale matches exactly ('en', 'pl', 'ru', 'uk')
- Verify fallback to English works

### Storage paths wrong
- Ensure admin actions use ID-based paths
- Never use display names in storage keys
- Check bucket names match in code

## Next Steps

1. Run the migration
2. Create initial categories and subcategories
3. Upload content using the new admin interface
4. Test locale switching
5. Monitor for any issues

The system is now ready for production use with full i18n support!
