import { Container } from '@/ui/container';
import PuzzleBrowser from '@/components/puzzle-browser';
import { getPuzzleList } from '@/lib/content-repository';
import { BackArrow } from '@/components/back-arrow';

export const dynamic = "force-dynamic";

export default async function JigsawGalleryPage() {
  // Fetch puzzles on the server side (bypasses RLS with service role key)
  const puzzles = await getPuzzleList();

  return (
    <>
      <BackArrow />
      <Container className="pt-20 md:pt-24 pb-8">
        <PuzzleBrowser serverPuzzles={puzzles} />
      </Container>
    </>
  );
}
