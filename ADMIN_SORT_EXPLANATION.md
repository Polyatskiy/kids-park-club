# What is SORT (sort_order) used for?

## Purpose

The `sort_order` field in the database schema is used to **control the display order** of categories and subcategories on the public website.

## How it works

- **Lower numbers appear first**: Categories/subcategories with `sort_order = 0` appear before those with `sort_order = 10`
- **Default value**: When creating a new category or subcategory, the default `sort_order` is `0`
- **Database query**: The system orders results by `sort_order` in ascending order (`.order("sort_order", { ascending: true })`)

## Example

If you have three categories:
- "Animals" with `sort_order = 10`
- "Nature" with `sort_order = 5`  
- "Vehicles" with `sort_order = 0`

They will appear on the website in this order:
1. Vehicles (sort_order: 0)
2. Nature (sort_order: 5)
3. Animals (sort_order: 10)

## Usage in Admin Panel

When creating or editing a category/subcategory, you can set the `sort_order` value:
- Use **0, 10, 20, 30...** for easy reordering later
- Leave gaps between numbers so you can insert items between them without renumbering everything
- Lower numbers = appear first/higher on the page

## Where it's used

- **Categories**: Displayed in order on `/coloring` and `/games/jigsaw/gallery` pages
- **Subcategories**: Displayed in order within each category section
- **Admin panel**: Shows the current sort_order value for reference

## Technical Details

- Field type: `INTEGER`
- Default: `0`
- Indexed: Yes (`idx_categories_sort`, `idx_subcategories_sort`)
- Can be negative: Yes (if you want something to appear very early)
