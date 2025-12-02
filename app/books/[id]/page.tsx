import { Container } from "@/ui/container";
import { getBookBySlug } from "@/lib/content-repository";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
};

export default async function BookDetailPage({ params }: Props) {
  const book = await getBookBySlug(params.id);
  if (!book) return notFound();

  const pages = book.pages ?? [];

  return (
    <Container className="py-8 space-y-4">
      <h1 className="text-2xl font-bold">{book.title}</h1>
      <p className="text-sm text-gray-600 mb-2">{book.description}</p>

      <div className="space-y-4">
        {pages.map((p: any) => (
          <div
            key={p.number}
            className="bg-white rounded-2xl p-4 shadow-sm whitespace-pre-line"
          >
            {p.content}
          </div>
        ))}
      </div>
    </Container>
  );
}
