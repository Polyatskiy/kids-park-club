import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="p-10 flex flex-col gap-6 text-xl">
      <h1 className="text-3xl font-bold">Админ-панель</h1>

      <Link href="/admin/coloring" className="underline">
        Управление разукрасками
      </Link>

      <Link href="/" className="underline">
        ← Вернуться на сайт
      </Link>
    </div>
  );
}
