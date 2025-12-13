import { uploadPuzzle } from "../admin-actions";

export default function PuzzlesAdminPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Add New Puzzle</h1>

      <form action={uploadPuzzle} className="space-y-4">

        <input
          name="title"
          placeholder="Title (e.g.: Warsaw)"
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="category"
          placeholder="Category (e.g.: Cities)"
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="subcategory"
          placeholder="Subcategory (e.g.: Europe)"
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
          Upload Puzzle
        </button>
      </form>

      <div className="mt-8">
        <a href="/admin" className="text-blue-600 underline">
          ← Back to Admin Panel
        </a>
      </div>
    </div>
  );
}

