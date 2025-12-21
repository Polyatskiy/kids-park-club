import dynamic from "next/dynamic";
import { getPuzzleById } from "@/lib/content-repository";

// Dynamically import JigsawGame to reduce initial bundle size and improve INP
const JigsawGame = dynamic(() => import("./JigsawGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-700">Loading puzzle...</p>
      </div>
    </div>
  ),
});

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
    <JigsawGame
      initialImageId={imageId}
      initialGridSize={gridSize}
      puzzleImageUrl={puzzleImageUrl}
      puzzleTitle={puzzleTitle}
    />
  );
}
