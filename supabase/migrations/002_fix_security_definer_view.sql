-- ============================================
-- Fix: Remove SECURITY DEFINER view security issue
-- ============================================
-- This migration fixes the security issue with categories_with_translations view
--
-- The view is not used in the application codebase (verified via grep).
-- The application queries tables directly through Supabase client which handles RLS properly.
--
-- SOLUTION: Remove the unused view entirely (safest approach)
-- ============================================

DROP VIEW IF EXISTS categories_with_translations CASCADE;

-- ============================================
-- Alternative: If you need to keep the view, recreate it WITHOUT SECURITY DEFINER
-- (Uncomment the following if you need the view)
-- ============================================
-- CREATE VIEW categories_with_translations AS
-- SELECT 
--   c.id,
--   c.type,
--   c.code,
--   c.sort_order,
--   c.is_visible,
--   c.created_at,
--   COALESCE(ci.title, ci_en.title) as title,
--   COALESCE(ci.description, ci_en.description) as description
-- FROM categories c
-- LEFT JOIN category_i18n ci ON c.id = ci.category_id
-- LEFT JOIN category_i18n ci_en ON c.id = ci_en.category_id AND ci_en.locale = 'en'
-- WHERE c.is_visible = true;
--
-- GRANT SELECT ON categories_with_translations TO authenticated;
-- GRANT SELECT ON categories_with_translations TO anon;

