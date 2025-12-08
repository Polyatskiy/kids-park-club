import JigsawGame from "./JigsawGame";

interface JigsawPageProps {
  searchParams?: Promise<{
    image?: string;
    size?: string;
  }>;
}

export default async function JigsawPage({ searchParams }: JigsawPageProps) {
  const params = await searchParams;
  const imageId = params?.image;
  const size = params?.size;
  const gridSize = size ? Number(size) : undefined;

  return (
    <JigsawGame
      initialImageId={imageId}
      initialGridSize={gridSize}
    />
  );
}
