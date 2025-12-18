import { Link } from "@/i18n/routing";
import { Card } from "@/ui/card";
import type { Book } from "@/types/content";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.slug}`}>
      <Card className="hover:shadow-strong cursor-pointer transition-shadow">
        <div
          style={{ backgroundColor: book.coverColor }}
          className="w-full rounded-xl p-3"
        >
          <h3 className="font-semibold text-slate-900 mb-1">{book.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {book.description}
          </p>
        </div>
      </Card>
    </Link>
  );
}
