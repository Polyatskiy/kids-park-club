import { uploadMany } from "../admin-actions";

export default function UploadMany() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Массовая загрузка</h1>

      <form action={uploadMany} className="flex flex-col gap-4 max-w-md">
        <input name="category" placeholder="Категория" required />
        <input name="subcategory" placeholder="Подкатегория" required />

        <input type="file" name="files" multiple required />

        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Загрузить файлы
        </button>
      </form>
    </div>
  );
}
