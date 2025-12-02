import { uploadOne } from "../admin-actions";

export default function UploadOne() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Загрузить одну картинку</h1>

      <form action={uploadOne} className="flex flex-col gap-4 max-w-md">
        <input name="title" placeholder="Название" required />

        <input name="category" placeholder="Категория" required />
        <input name="subcategory" placeholder="Подкатегория" required />

        <input type="file" name="file" required />

        <button className="px-4 py-2 bg-green-600 text-white rounded-lg">
          Загрузить
        </button>
      </form>
    </div>
  );
}
