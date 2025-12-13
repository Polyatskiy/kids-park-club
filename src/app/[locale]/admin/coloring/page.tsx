import { uploadItem } from "../admin-actions";

export default function NewItemPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Add New Coloring Page</h1>

      <form action={uploadItem} className="space-y-4">

        <input
          name="title"
          placeholder="Title"
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="category"
          placeholder="Category (Animals)"
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="subcategory"
          placeholder="Subcategory (Cats)"
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
          Upload
        </button>
      </form>
    </div>
  );
}
