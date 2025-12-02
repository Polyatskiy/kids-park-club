import Link from "next/link";
import { Card } from "@/ui/card";
import type { Book } from "@/types/content";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.slug}`}>
      <Card className="hover:shadow-md cursor-pointer">
        <div style={{ backgroundColor: book.coverColor }} className="w-full">
          <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
          <p className="text-sm text-gray-700 line-clamp-2">
            {book.description}
          </p>
        </div>
      </Card>
    </Link>
  );
}
