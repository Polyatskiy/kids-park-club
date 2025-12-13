import { Container } from "@/ui/container";
import { getBooks } from "@/lib/content-repository";
import { BookCard } from "@/components/book-card";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const books = await getBooks();

  return (
    <Container className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Books</h1>
        <p className="text-sm text-gray-600">
          Short stories and tales for reading together.
        </p>
      </div>

      {books.length === 0 && (
        <p className="text-sm text-gray-500">No books yet.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {books.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </Container>
  );
}
