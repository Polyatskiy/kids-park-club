import { supabaseServer } from "@/lib/supabaseClient";
import { updateItem } from "../../admin-actions";

export default async function EditColoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // тут уже всё ок

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("coloring_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error(error);
    return <div className="p-6">Ошибка загрузки данных.</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">
        Редактировать: {data.title}
      </h1>

      <form
        action={updateItem}
        method="post"
        encType="multipart/form-data"
        className="space-y-4"
      >
        <input type="hidden" name="id" value={data.id} />

        <input
          name="title"
          defaultValue={data.title}
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="category"
          defaultValue={data.category}
          className="w-full border p-2 rounded"
          required
        />

        <input
          name="subcategory"
          defaultValue={data.subcategory}
          className="w-full border p-2 rounded"
          required
        />

        <div>
          <div className="text-sm text-gray-700 mb-1">Текущая миниатюра:</div>
          <div className="w-24 h-24 bg-white border rounded flex items-center justify-center overflow-hidden">
            <img
              src={data.thumbnail_url}
              className="w-full h-full object-contain"
              alt="thumbnail"
            />
          </div>
        </div>

        <div className="text-gray-700 text-sm">Заменить изображение:</div>
        <input
          type="file"
          name="file"
          accept="image/*"
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          💾 Сохранить изменения
        </button>
      </form>
    </div>
  );
}
