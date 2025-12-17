"use client";

import { useState, useEffect } from "react";
import { uploadItem, updateItem, deleteItem, getItemTranslations, bulkUploadItems } from "../admin-actions-i18n";
import { routing } from "@/i18n/routing";
import type { Category, Subcategory, Item } from "@/types/content";

interface ItemManagerProps {
  coloringCategories: Category[];
  puzzleCategories: Category[];
  initialColoringItems: Item[];
  initialPuzzleItems: Item[];
  allSubcategories: Subcategory[];
}

export function ItemManager({
  coloringCategories,
  puzzleCategories,
  initialColoringItems,
  initialPuzzleItems,
  allSubcategories,
}: ItemManagerProps) {
  // Debug: Log subcategories on mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ItemManager mounted with subcategories:', {
        totalSubcategories: allSubcategories.length,
        subcategories: allSubcategories.map(s => ({
          id: s.id,
          categoryId: s.categoryId,
          title: s.title
        }))
      });
    }
  }, [allSubcategories]);
  const [selectedType, setSelectedType] = useState<'coloring' | 'puzzles'>('coloring');
  const [coloringItems, setColoringItems] = useState(initialColoringItems);
  const [puzzleItems, setPuzzleItems] = useState(initialPuzzleItems);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemTranslations, setItemTranslations] = useState<Record<string, Record<string, { title: string; shortTitle: string | null; description: string | null }>>>({});
  const [bulkUploadProgress, setBulkUploadProgress] = useState<{ uploading: boolean; results: any } | null>(null);

  const currentCategories = selectedType === 'coloring' ? coloringCategories : puzzleCategories;
  const currentItems = selectedType === 'coloring' ? coloringItems : puzzleItems;
  const editingItem = currentItems.find(i => i.id === editingId);

  // Initialize category/subcategory when editing
  useEffect(() => {
    if (editingItem && editingId) {
      setSelectedCategoryId(editingItem.categoryId);
      setSelectedSubcategoryId(editingItem.subcategoryId || "");
    } else if (!editingId) {
      // Reset when not editing
      setSelectedCategoryId("");
      setSelectedSubcategoryId("");
    }
  }, [editingId, editingItem]);

  // Load translations when editing
  useEffect(() => {
    if (editingId) {
      getItemTranslations(editingId).then((translations) => {
        if (translations) {
          setItemTranslations({ [editingId]: translations });
        }
      });
    } else {
      setItemTranslations({});
    }
  }, [editingId]);

  // Filter subcategories for selected category
  // Use strict comparison with normalized strings to ensure matching
  // Also deduplicate by ID to prevent duplicate keys
  const currentSubcategories = allSubcategories
    .filter(sub => {
      const subCatId = String(sub.categoryId).trim();
      const selectedCatId = String(selectedCategoryId).trim();
      return subCatId === selectedCatId;
    })
    .filter((sub, index, self) => 
      // Deduplicate: keep only first occurrence of each ID
      index === self.findIndex(s => s.id === sub.id)
    );

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Subcategory Debug:', {
        selectedCategoryId,
        allSubcategoriesCount: allSubcategories.length,
        currentSubcategoriesCount: currentSubcategories.length,
        allSubcategories: allSubcategories.map(s => ({
          id: s.id,
          categoryId: s.categoryId,
          categoryIdType: typeof s.categoryId,
          title: s.title
        })),
        selectedCategoryIdType: typeof selectedCategoryId,
        filteredSubcategories: currentSubcategories.map(s => ({ id: s.id, title: s.title }))
      });
    }
  }, [selectedCategoryId, allSubcategories, currentSubcategories]);

  const handleUpload = async (formData: FormData) => {
    try {
      await uploadItem(formData);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateItem(formData);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append("item_id", itemId);
      await deleteItem(formData);
      window.location.reload();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBulkUpload = async (formData: FormData) => {
    try {
      setBulkUploadProgress({ uploading: true, results: null });
      const result = await bulkUploadItems(formData);
      setBulkUploadProgress({ uploading: false, results: result });
      
      // Reload after 2 seconds to show new items
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setBulkUploadProgress({ uploading: false, results: null });
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderItemForm = (item?: Item) => {
    const isEditing = !!item;
    const formAction = isEditing ? handleUpdate : handleUpload;

    // Re-filter subcategories for the current selected category (in case it changed)
    // Use strict comparison with normalized strings
    // Filter and deduplicate subcategories for the form
    const formSubcategories = allSubcategories
      .filter(sub => {
        const subCatId = String(sub.categoryId).trim();
        const selectedCatId = String(selectedCategoryId).trim();
        return subCatId === selectedCatId;
      })
      .filter((sub, index, self) => 
        // Deduplicate: keep only first occurrence of each ID
        index === self.findIndex(s => s.id === sub.id)
      );

    return (
      <form action={formAction} className="space-y-4 p-6 border rounded-lg bg-white">
        {isEditing && (
          <input type="hidden" name="item_id" value={item.id} />
        )}

        <div>
          <label className="block mb-2 font-semibold">Type</label>
          <select
            name="type"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as 'coloring' | 'puzzles');
              setSelectedCategoryId("");
              setSelectedSubcategoryId("");
            }}
            required
            className="w-full border p-2 rounded"
            disabled={isEditing}
          >
            <option value="coloring">Coloring</option>
            <option value="puzzles">Puzzles</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Category</label>
          <select
            name="category_id"
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedSubcategoryId(""); // Reset subcategory when category changes
            }}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select category</option>
            {currentCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>

        {selectedCategoryId && (
          <div>
            <label className="block mb-2 font-semibold">Subcategory (optional)</label>
            <select
              name="subcategory_id"
              value={selectedSubcategoryId}
              onChange={(e) => setSelectedSubcategoryId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">None</option>
              {formSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.title}
                </option>
              ))}
            </select>
            {formSubcategories.length === 0 && selectedCategoryId && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="text-yellow-800 font-medium">No subcategories available for this category.</p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-yellow-700">Debug Info</summary>
                    <div className="mt-1 p-2 bg-white rounded text-xs font-mono">
                      <div>Selected Category ID: {selectedCategoryId}</div>
                      <div>Total Subcategories Loaded: {allSubcategories.length}</div>
                      <div>Filtered Subcategories: {formSubcategories.length}</div>
                      <div>Selected Category ID: {selectedCategoryId}</div>
                      <div>All Subcategory Category IDs:</div>
                      <ul className="list-disc list-inside ml-2">
                        {allSubcategories.map(s => (
                          <li key={s.id}>
                            {s.title} (categoryId: {s.categoryId}, match: {String(s.categoryId) === String(selectedCategoryId) ? '✅ YES' : '❌ NO'})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        {!isEditing && (
          <div>
            <label className="block mb-2 font-semibold">Image File</label>
            <input
              type="file"
              name="file"
              accept="image/*"
              required
              className="w-full border p-2 rounded"
            />
          </div>
        )}

        {isEditing && (
          <div>
            <label className="block mb-2 font-semibold">Replace Image (optional)</label>
            <input
              type="file"
              name="file"
              accept="image/*"
              className="w-full border p-2 rounded"
            />
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Translations</h3>
          <div className="space-y-4">
            {routing.locales.map((locale) => {
              const translations = item && itemTranslations[item.id] 
                ? itemTranslations[item.id] 
                : {};
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
                  <input
                    type="text"
                    name={`short_title_${locale}`}
                    defaultValue={translation?.shortTitle || ""}
                    placeholder={`Short Title (${locale}, optional)`}
                    className="w-full border p-2 rounded mb-2"
                  />
                  <textarea
                    name={`description_${locale}`}
                    defaultValue={translation?.description || ""}
                    placeholder={`Description (${locale}, optional)`}
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
            {isEditing ? "Update" : "Upload"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setSelectedCategoryId("");
                setSelectedSubcategoryId("");
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  };

  return (
    <div>
      <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg flex gap-4 flex-wrap">
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setShowBulkUpload(false);
            setEditingId(null);
            setSelectedCategoryId("");
            setSelectedSubcategoryId("");
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          {showCreateForm ? "Cancel" : "Upload New Item"}
        </button>
        <button
          onClick={() => {
            setShowBulkUpload(!showBulkUpload);
            setShowCreateForm(false);
            setEditingId(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showBulkUpload ? "Cancel" : "📦 Bulk Upload (20-30 files)"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedType('coloring')}
            className={`px-4 py-2 rounded transition-colors ${selectedType === 'coloring' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Coloring ({coloringItems.length})
          </button>
          <button
            onClick={() => setSelectedType('puzzles')}
            className={`px-4 py-2 rounded transition-colors ${selectedType === 'puzzles' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Puzzles ({puzzleItems.length})
          </button>
        </div>
      </div>

      {showBulkUpload && (
        <div className="mb-8 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Bulk Upload Files</h2>
          <form action={handleBulkUpload} className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Type</label>
              <select
                name="type"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as 'coloring' | 'puzzles');
                  setSelectedCategoryId("");
                  setSelectedSubcategoryId("");
                }}
                required
                className="w-full border p-2 rounded"
              >
                <option value="coloring">Coloring</option>
                <option value="puzzles">Puzzles</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">Category</label>
              <select
                name="category_id"
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSelectedSubcategoryId("");
                }}
                required
                className="w-full border p-2 rounded"
              >
                <option value="">Select category</option>
                {currentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategoryId && (
              <div>
                <label className="block mb-2 font-semibold">Subcategory (optional)</label>
                <select
                  name="subcategory_id"
                  value={selectedSubcategoryId}
                  onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="">None</option>
                  {currentSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block mb-2 font-semibold">
                Select Multiple Files (up to 50 files)
              </label>
              <input
                type="file"
                name="files"
                accept="image/*"
                multiple
                required
                className="w-full border p-2 rounded"
              />
              <p className="text-sm text-gray-600 mt-2">
                💡 Tip: File names will be used as titles (English) if no translations file provided.
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">🌍 Translations (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV or JSON file with translations, or paste JSON directly. This will automatically fill titles, short titles, and descriptions for all 4 languages.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-semibold text-sm">
                    Option 1: Upload CSV/JSON File
                  </label>
                  <input
                    type="file"
                    name="translations_file"
                    accept=".csv,.json"
                    className="w-full border p-2 rounded text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    CSV format: filename,title_en,title_pl,title_ru,title_uk,short_title_en,short_title_pl,short_title_ru,short_title_uk,description_en,description_pl,description_ru,description_uk
                  </p>
                  <a 
                    href="/translations-example.csv" 
                    download
                    className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                  >
                    📥 Download CSV Example Template
                  </a>
                </div>

                <div className="relative">
                  <div className="absolute top-0 right-0 text-xs text-gray-500">OR</div>
                  <label className="block mb-2 font-semibold text-sm">
                    Option 2: Paste JSON
                  </label>
                  <textarea
                    name="translations_json"
                    placeholder='{"cat-1.png": {"en": {"title": "Cute Cat", "shortTitle": "Cat", "description": "A cute cat coloring page"}, "pl": {"title": "Słodki Kot", ...}}, ...}'
                    rows={6}
                    className="w-full border p-2 rounded text-sm font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JSON format: {"{"}"filename.png": {"{"}"en": {"{"}"title": "...", "shortTitle": "...", "description": "..."}, "pl": {...}, "ru": {...}, "uk": {...}}{"}"}, ...{"}"}
                  </p>
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                  📋 Show Format Examples
                </summary>
                <div className="mt-2 p-4 bg-gray-50 rounded text-xs space-y-4">
                  <div>
                    <p className="font-semibold mb-1">CSV Example:</p>
                    <pre className="bg-white p-2 rounded border overflow-x-auto">
{`filename,title_en,title_pl,title_ru,title_uk,short_title_en,short_title_pl,short_title_ru,short_title_uk,description_en,description_pl,description_ru,description_uk
cat-1.png,Cute Cat,Słodki Kot,Милый Кот,Милий Кіт,Cat,Kot,Кот,Кіт,Free printable cat coloring page,Darmowa kolorowanka kota,Бесплатная раскраска кота,Безкоштовна розмальовка кота
dog-1.jpg,Happy Dog,Wesoły Pies,Счастливая Собака,Щасливий Пес,Dog,Pies,Собака,Пес,Free printable dog coloring page,Darmowa kolorowanka psa,Бесплатная раскраска собаки,Безкоштовна розмальовка пса`}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">JSON Example:</p>
                    <pre className="bg-white p-2 rounded border overflow-x-auto">
{`{
  "cat-1.png": {
    "en": {
      "title": "Cute Cat",
      "shortTitle": "Cat",
      "description": "Free printable cat coloring page"
    },
    "pl": {
      "title": "Słodki Kot",
      "shortTitle": "Kot",
      "description": "Darmowa kolorowanka kota"
    },
    "ru": {
      "title": "Милый Кот",
      "shortTitle": "Кот",
      "description": "Бесплатная раскраска кота"
    },
    "uk": {
      "title": "Милий Кіт",
      "shortTitle": "Кіт",
      "description": "Безкоштовна розмальовка кота"
    }
  }
}`}
                    </pre>
                  </div>
                </div>
              </details>
            </div>

            <button
              type="submit"
              disabled={bulkUploadProgress?.uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {bulkUploadProgress?.uploading ? "Uploading..." : "📦 Upload All Files"}
            </button>
          </form>

          {bulkUploadProgress?.uploading && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">Uploading files, please wait...</span>
              </div>
            </div>
          )}

          {bulkUploadProgress?.results && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Upload Results:</h3>
              <div className="space-y-1 text-sm">
                <p className="text-green-600">
                  ✅ Successful: {bulkUploadProgress.results.successful} / {bulkUploadProgress.results.total}
                </p>
                {bulkUploadProgress.results.failed > 0 && (
                  <p className="text-red-600">
                    ❌ Failed: {bulkUploadProgress.results.failed} / {bulkUploadProgress.results.total}
                  </p>
                )}
                {bulkUploadProgress.results.failed > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-red-600 font-medium">Show failed files</summary>
                    <ul className="mt-2 space-y-1 pl-4">
                      {bulkUploadProgress.results.results
                        .filter((r: any) => !r.success)
                        .map((r: any, idx: number) => (
                          <li key={idx} className="text-red-600">
                            {r.fileName}: {r.error}
                          </li>
                        ))}
                    </ul>
                  </details>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">Page will reload in a moment...</p>
            </div>
          )}
        </div>
      )}

      {showCreateForm && !editingId && (
        <div onReset={() => {
          setSelectedCategoryId("");
          setSelectedSubcategoryId("");
        }}>
          {renderItemForm()}
        </div>
      )}
      {editingId && editingItem && (
        <div>
          {renderItemForm(editingItem)}
        </div>
      )}

      <div className="mt-8 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 capitalize text-gray-900">{selectedType} Items</h2>
        {currentItems.length === 0 ? (
          <p className="text-gray-600 font-medium">No items yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="border-2 border-gray-200 rounded-lg p-4 bg-white/80 hover:shadow-md transition-shadow"
              >
                {item.thumbUrl && (
                  <img
                    src={item.thumbUrl}
                    alt={item.title}
                    className="w-full aspect-square object-cover rounded mb-2"
                  />
                )}
                <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-gray-900">{item.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setSelectedCategoryId(item.categoryId);
                      setSelectedSubcategoryId(item.subcategoryId || "");
                    }}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
