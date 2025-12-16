"use client";

import { useState, useEffect } from "react";
import { createCategory, updateCategory, deleteCategory, createSubcategory, updateSubcategory, deleteSubcategory, getCategoryTranslations, getSubcategoryTranslations } from "../admin-actions-i18n";
import { routing } from "@/i18n/routing";
import type { Category, Subcategory } from "@/types/content";

interface CategoryManagerProps {
  initialColoringCategories: Category[];
  initialPuzzleCategories: Category[];
  initialBothCategories: Category[];
  initialSubcategories: Subcategory[];
}

export function CategoryManager({
  initialColoringCategories,
  initialPuzzleCategories,
  initialBothCategories,
  initialSubcategories,
}: CategoryManagerProps) {
  const [coloringCategories, setColoringCategories] = useState(initialColoringCategories);
  const [puzzleCategories, setPuzzleCategories] = useState(initialPuzzleCategories);
  const [bothCategories, setBothCategories] = useState(initialBothCategories);
  const [subcategories, setSubcategories] = useState(initialSubcategories);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [creatingSubcategoryForCategoryId, setCreatingSubcategoryForCategoryId] = useState<string | null>(null);
  const [categoryTranslations, setCategoryTranslations] = useState<Record<string, Record<string, { title: string; description: string | null }>>>({});
  const [subcategoryTranslations, setSubcategoryTranslations] = useState<Record<string, Record<string, { title: string; description: string | null }>>>({});

  const handleCreate = async (formData: FormData) => {
    try {
      await createCategory(formData);
      // Reload page to refresh data
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateCategory(formData);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? This will also delete all subcategories and items.")) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append("category_id", categoryId);
      await deleteCategory(formData);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateSubcategory = async (formData: FormData) => {
    try {
      await createSubcategory(formData);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateSubcategory = async (formData: FormData) => {
    try {
      await updateSubcategory(formData);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append("subcategory_id", subcategoryId);
      await deleteSubcategory(formData);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load translations when editing
  useEffect(() => {
    if (editingId) {
      getCategoryTranslations(editingId).then((translations) => {
        if (translations) {
          setCategoryTranslations({ [editingId]: translations });
        }
      });
    } else {
      setCategoryTranslations({});
    }
  }, [editingId]);

  const renderCategoryForm = (category?: Category) => {
    const isEditing = !!category;
    const formAction = isEditing ? handleUpdate : handleCreate;
    const translations = category && categoryTranslations[category.id] 
      ? categoryTranslations[category.id] 
      : {};

    return (
      <form action={formAction} className="space-y-4 p-6 border rounded-lg bg-white">
        {isEditing && (
          <input type="hidden" name="category_id" value={category.id} />
        )}

        <div>
          <label className="block mb-2 font-semibold">Type</label>
          <select
            name="type"
            defaultValue={category?.type || "coloring"}
            required
            className="w-full border p-2 rounded"
            disabled={isEditing}
          >
            <option value="coloring">Coloring</option>
            <option value="puzzles">Puzzles</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Code (optional)</label>
          <input
            type="text"
            name="code"
            defaultValue={category?.code || ""}
            placeholder="e.g. animals"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Sort Order</label>
          <input
            type="number"
            name="sort_order"
            defaultValue={category?.sortOrder || 0}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_visible"
              value="true"
              defaultChecked={category?.isVisible !== false}
              className="w-4 h-4"
            />
            Visible
          </label>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Translations</h3>
          <div className="space-y-4">
            {routing.locales.map((locale) => {
              const translation = translations[locale];
              return (
                <div key={locale} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium mb-2 uppercase">{locale}</h4>
                  <input
                    type="text"
                    name={`title_${locale}`}
                    defaultValue={translation?.title || ""}
                    placeholder={`Title (${locale})`}
                    required={locale === 'en'}
                    className="w-full border p-2 rounded mb-2"
                  />
                  <textarea
                    name={`description_${locale}`}
                    defaultValue={translation?.description || ""}
                    placeholder={`Description (${locale})`}
                    className="w-full border p-2 rounded"
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {isEditing ? "Update" : "Create"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  };

  // Load subcategory translations when editing
  useEffect(() => {
    if (editingSubcategoryId) {
      getSubcategoryTranslations(editingSubcategoryId).then((translations) => {
        if (translations) {
          setSubcategoryTranslations({ [editingSubcategoryId]: translations });
        }
      });
    } else {
      setSubcategoryTranslations({});
    }
  }, [editingSubcategoryId]);

  const renderSubcategoryForm = (categoryId: string, subcategory?: Subcategory) => {
    const isEditing = !!subcategory;
    const formAction = isEditing ? handleUpdateSubcategory : handleCreateSubcategory;
    const translations = subcategory && subcategoryTranslations[subcategory.id] 
      ? subcategoryTranslations[subcategory.id] 
      : {};

    return (
      <form action={formAction} className="space-y-4 p-4 border rounded-lg bg-gray-50 mt-2">
        <input type="hidden" name="category_id" value={categoryId} />
        {isEditing && (
          <input type="hidden" name="subcategory_id" value={subcategory.id} />
        )}

        <div>
          <label className="block mb-2 font-semibold text-sm">Code (optional)</label>
          <input
            type="text"
            name="code"
            defaultValue={subcategory?.code || ""}
            placeholder="e.g. cats"
            className="w-full border p-2 rounded text-sm"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-sm">Sort Order</label>
          <input
            type="number"
            name="sort_order"
            defaultValue={subcategory?.sortOrder || 0}
            className="w-full border p-2 rounded text-sm"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_visible"
              value="true"
              defaultChecked={subcategory?.isVisible !== false}
              className="w-4 h-4"
            />
            Visible
          </label>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-semibold mb-2 text-sm">Translations</h4>
          <div className="space-y-3">
            {routing.locales.map((locale) => {
              const translation = translations[locale];
              return (
                <div key={locale} className="border-l-2 border-blue-400 pl-3">
                  <h5 className="font-medium mb-1 text-xs uppercase">{locale}</h5>
                  <input
                    type="text"
                    name={`title_${locale}`}
                    defaultValue={translation?.title || ""}
                    placeholder={`Title (${locale})`}
                    required={locale === 'en'}
                    className="w-full border p-1.5 rounded text-sm mb-1"
                  />
                  <textarea
                    name={`description_${locale}`}
                    defaultValue={translation?.description || ""}
                    placeholder={`Description (${locale})`}
                    className="w-full border p-1.5 rounded text-sm"
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            {isEditing ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                setEditingSubcategoryId(null);
              } else {
                setCreatingSubcategoryForCategoryId(null);
              }
            }}
            className="px-3 py-1.5 bg-gray-400 text-white rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  const renderCategoryList = (categories: Category[], type: string) => {
    return (
      <div className="mb-8 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 capitalize text-gray-900">{type} Categories</h2>
        {categories.length === 0 ? (
          <p className="text-gray-600 font-medium">No categories yet.</p>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => {
              const categorySubcategories = subcategories.filter(sub => sub.categoryId === cat.id);
              const isExpanded = expandedCategoryId === cat.id;
              const isCreatingSubcategory = creatingSubcategoryForCategoryId === cat.id;
              const editingSubcategory = editingSubcategoryId 
                ? categorySubcategories.find(s => s.id === editingSubcategoryId)
                : null;

              return (
                <div
                  key={`${type}-${cat.id}`}
                  className="border-2 border-gray-200 rounded-lg p-4 bg-white/80 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{cat.title}</h3>
                      {cat.code && <p className="text-sm text-gray-600">Code: {cat.code}</p>}
                      <p className="text-sm text-gray-600">Sort: {cat.sortOrder}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {categorySubcategories.length} subcategory{categorySubcategories.length !== 1 ? 'ies' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setExpandedCategoryId(isExpanded ? null : cat.id);
                          setCreatingSubcategoryForCategoryId(null);
                          setEditingSubcategoryId(null);
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                      >
                        {isExpanded ? "Hide" : "Manage"} Subcategories
                      </button>
                      <button
                        onClick={() => setEditingId(cat.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">Subcategories</h4>
                        {!isCreatingSubcategory && (
                          <button
                            onClick={() => {
                              setCreatingSubcategoryForCategoryId(cat.id);
                              setEditingSubcategoryId(null);
                            }}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            + Add Subcategory
                          </button>
                        )}
                      </div>

                      {isCreatingSubcategory && renderSubcategoryForm(cat.id)}
                      {editingSubcategory && renderSubcategoryForm(cat.id, editingSubcategory)}

                      {categorySubcategories.length === 0 && !isCreatingSubcategory && !editingSubcategory && (
                        <p className="text-sm text-gray-500 italic">No subcategories yet. Click "Add Subcategory" to create one.</p>
                      )}

                      {categorySubcategories.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {categorySubcategories.map((sub, index) => (
                            <div
                              key={`${type}-${cat.id}-${sub.id}-${index}`}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                            >
                              <div>
                                <span className="font-medium text-sm text-gray-900">{sub.title}</span>
                                {sub.code && <span className="text-xs text-gray-500 ml-2">({sub.code})</span>}
                                <span className="text-xs text-gray-500 ml-2">Sort: {sub.sortOrder}</span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingSubcategoryId(sub.id);
                                    setCreatingSubcategoryForCategoryId(null);
                                  }}
                                  className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSubcategory(sub.id)}
                                  className="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const editingCategory = [...coloringCategories, ...puzzleCategories, ...bothCategories]
    .find(c => c.id === editingId);

  return (
    <div>
      <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingId(null);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          {showCreateForm ? "Cancel" : "Create New Category"}
        </button>
      </div>

      {showCreateForm && !editingId && renderCategoryForm()}
      {editingId && editingCategory && renderCategoryForm(editingCategory)}

      {renderCategoryList(coloringCategories, "coloring")}
      {renderCategoryList(puzzleCategories, "puzzles")}
      {renderCategoryList(bothCategories, "both")}
    </div>
  );
}
