import { notFound } from "next/navigation";
import { Container } from "@/ui/container";
import { getAudioStoryBySlug } from "@/lib/content-repository";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
};

export default async function AudioStoryDetailPage({ params }: Props) {
  const story = await getAudioStoryBySlug(params.id);
  if (!story) return notFound();

  return (
    <Container className="py-8 space-y-4">
      <h1 className="text-2xl font-bold">{story.title}</h1>
      <p className="text-sm text-gray-600">{story.description}</p>
      <audio
        controls
        src={story.audioUrl}
        className="w-full mt-4 rounded-2xl"
      >
        Ваш браузер не поддерживает аудио.
      </audio>
    </Container>
  );
}
