-- ============================================
-- Content Model with Normalized i18n Support
-- For Coloring Pages and Puzzles
-- ============================================

-- Drop existing tables if they exist (backward compatibility not needed)
DROP TABLE IF EXISTS item_i18n CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS subcategory_i18n CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS category_i18n CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================================
-- A) Categories Table
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('coloring', 'puzzles', 'both')),
  code TEXT, -- Optional stable code (e.g. 'animals')
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_visible ON categories(is_visible) WHERE is_visible = true;
CREATE INDEX idx_categories_sort ON categories(sort_order);

-- ============================================
-- B) Category i18n Table
-- ============================================
CREATE TABLE category_i18n (
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'pl', 'ru', 'uk')),
  title TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (category_id, locale)
);

CREATE INDEX idx_category_i18n_locale ON category_i18n(locale);
CREATE INDEX idx_category_i18n_category ON category_i18n(category_id);

-- ============================================
-- C) Subcategories Table
-- ============================================
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  code TEXT, -- Optional stable code
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_subcategories_visible ON subcategories(is_visible) WHERE is_visible = true;
CREATE INDEX idx_subcategories_sort ON subcategories(sort_order);

-- ============================================
-- D) Subcategory i18n Table
-- ============================================
CREATE TABLE subcategory_i18n (
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'pl', 'ru', 'uk')),
  title TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (subcategory_id, locale)
);

CREATE INDEX idx_subcategory_i18n_locale ON subcategory_i18n(locale);
CREATE INDEX idx_subcategory_i18n_subcategory ON subcategory_i18n(subcategory_id);

-- ============================================
-- E) Items Table (shared for coloring and puzzles)
-- ============================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('coloring', 'puzzles')),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  slug TEXT, -- Optional stable slug (language-independent)
  source_path TEXT NOT NULL, -- Storage key: 'coloring/<categoryId>/<subCategoryId>/<itemId>/source.png'
  thumb_path TEXT, -- Storage key: '.../thumb.webp'
  width INTEGER,
  height INTEGER,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_subcategory ON items(subcategory_id);
CREATE INDEX idx_items_status ON items(status) WHERE status = 'published';
CREATE INDEX idx_items_visible ON items(is_visible) WHERE is_visible = true;
CREATE INDEX idx_items_created ON items(created_at DESC);
CREATE INDEX idx_items_slug ON items(slug) WHERE slug IS NOT NULL;

-- ============================================
-- F) Item i18n Table
-- ============================================
CREATE TABLE item_i18n (
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'pl', 'ru', 'uk')),
  title TEXT NOT NULL,
  short_title TEXT,
  description TEXT,
  search_text TEXT, -- For full-text search per locale
  PRIMARY KEY (item_id, locale)
);

CREATE INDEX idx_item_i18n_locale ON item_i18n(locale);
CREATE INDEX idx_item_i18n_item ON item_i18n(item_id);
CREATE INDEX idx_item_i18n_title ON item_i18n(locale, title);
CREATE INDEX idx_item_i18n_search ON item_i18n(locale, search_text) WHERE search_text IS NOT NULL;

-- ============================================
-- Updated_at Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at
  BEFORE UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies (Read-only for public, write for admin)
-- ============================================

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategory_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_i18n ENABLE ROW LEVEL SECURITY;

-- Public read access (only visible, published items)
CREATE POLICY "Public can read visible categories"
  ON categories FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Public can read category translations"
  ON category_i18n FOR SELECT
  USING (true);

CREATE POLICY "Public can read visible subcategories"
  ON subcategories FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Public can read subcategory translations"
  ON subcategory_i18n FOR SELECT
  USING (true);

CREATE POLICY "Public can read published visible items"
  ON items FOR SELECT
  USING (status = 'published' AND is_visible = true);

CREATE POLICY "Public can read item translations"
  ON item_i18n FOR SELECT
  USING (true);

-- Admin full access (service role key bypasses RLS, but we add policies for clarity)
-- Note: Admin operations should use service_role key which bypasses RLS
-- These policies are for completeness but may not be needed if using service_role

-- ============================================
-- Helper Views (Optional, for easier querying)
-- ============================================

-- View for categories with current locale translation (fallback to en)
-- This is a template - actual locale should be passed as parameter in queries
CREATE OR REPLACE VIEW categories_with_translations AS
SELECT 
  c.id,
  c.type,
  c.code,
  c.sort_order,
  c.is_visible,
  c.created_at,
  COALESCE(ci.title, ci_en.title) as title,
  COALESCE(ci.description, ci_en.description) as description
FROM categories c
LEFT JOIN category_i18n ci ON c.id = ci.category_id -- Current locale (to be filtered in query)
LEFT JOIN category_i18n ci_en ON c.id = ci_en.category_id AND ci_en.locale = 'en'
WHERE c.is_visible = true;

-- Similar views can be created for subcategories and items if needed
-- But it's better to handle fallback in application code for flexibility
