import { getPuzzleById } from "@/lib/content-repository";
import JigsawGame from "./JigsawGame";
import { BackArrow } from "@/components/back-arrow";

interface JigsawPageProps {
  searchParams?: Promise<{
    imageId?: string;
    image?: string; // fallback for old URLs
    size?: string;
  }>;
}

export default async function JigsawPage({ searchParams }: JigsawPageProps) {
  const params = await searchParams;
  
  // Support both imageId (new) and image (old) query params
  const imageId = params?.imageId || params?.image;
  const size = params?.size;
  const gridSize = size ? Number(size) : undefined;

  // If we have an imageId, try to load the puzzle from Supabase
  let puzzleImageUrl: string | undefined;
  let puzzleTitle: string | undefined;

  if (imageId) {
    // First try to load from Supabase (if it's a numeric ID)
    const puzzle = await getPuzzleById(imageId);
    if (puzzle) {
      puzzleImageUrl = puzzle.imageUrl;
      puzzleTitle = puzzle.title;
    }
  }

  return (
    <>
      <BackArrow />
      <JigsawGame
        initialImageId={imageId}
        initialGridSize={gridSize}
        puzzleImageUrl={puzzleImageUrl}
        puzzleTitle={puzzleTitle}
      />
    </>
  );
}
