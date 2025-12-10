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
      <Container className="pt-20 md:pt-24 pb-8 space-y-6">
        <div className="inline-flex flex-col gap-1 px-4 py-3 rounded-2xl bg-white/30 backdrop-blur-[14px] shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
          <h1 className="text-2xl md:text-3xl font-bold text-[#222]">Пазлы</h1>
          <p className="text-sm md:text-base text-[#333]">
            Выберите картинку и сложность, а потом собирайте пазл.
          </p>
        </div>

        <PuzzleBrowser serverPuzzles={puzzles} />
      </Container>
    </>
  );
}
