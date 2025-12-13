import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="p-10 flex flex-col gap-6 text-xl">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <Link href="/admin/coloring" className="underline">
        Manage Coloring Pages
      </Link>

      <Link href="/admin/puzzles" className="underline">
        Manage Puzzles
      </Link>

      <Link href="/" className="underline">
        ← Back to Site
      </Link>
    </div>
  );
}
