import { Container } from '@/ui/container';
import PuzzleBrowser from '@/components/puzzle-browser';
import { getPuzzleList } from '@/lib/content-repository';
import { BackArrow } from '@/components/back-arrow';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export const dynamic = "force-dynamic";

export default async function JigsawGalleryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure locale is valid
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  
  // Set request locale for server components
  setRequestLocale(validLocale);

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
