import { uploadPuzzle } from "../admin-actions";

export default function PuzzlesAdminPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Добавить новый пазл</h1>

      <form action={uploadPuzzle} className="space-y-4">

        <input
          name="title"
          placeholder="Название (например: Warsaw)"
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="category"
          placeholder="Категория (например: Cities)"
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="subcategory"
          placeholder="Подкатегория (например: Europe)"
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="file"
          name="file"
          accept="image/*"
          className="w-full border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Загрузить пазл
        </button>
      </form>

      <div className="mt-8">
        <a href="/admin" className="text-blue-600 underline">
          ← Вернуться в админ-панель
        </a>
      </div>
    </div>
  );
}

