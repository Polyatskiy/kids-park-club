import { Container } from '@/ui/container';
import PuzzleBrowser from '@/components/puzzle-browser';
import { getPuzzleList } from '@/lib/content-repository';

export const dynamic = "force-dynamic";

export default async function JigsawGalleryPage() {
  // Fetch puzzles on the server side (bypasses RLS with service role key)
  const puzzles = await getPuzzleList();

  return (
    <Container className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Пазлы</h1>
        <p className="text-sm text-gray-600">
          Выберите картинку и сложность, а потом собирайте пазл.
        </p>
      </div>

      <PuzzleBrowser serverPuzzles={puzzles} />
    </Container>
  );
}
