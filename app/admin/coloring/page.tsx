import { uploadItem } from "../admin-actions";

export default function NewItemPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Добавить новую раскраску</h1>

      <form action={uploadItem} method="post" encType="multipart/form-data" className="space-y-4">

        <input
          name="title"
          placeholder="Название"
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="category"
          placeholder="Категория (Animals)"
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="subcategory"
          placeholder="Подкатегория (Cats)"
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
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Загрузить
        </button>
      </form>
    </div>
  );
}
