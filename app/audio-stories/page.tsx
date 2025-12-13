import { Container } from "@/ui/container";
import { getAudioStories } from "@/lib/content-repository";
import { AudioCard } from "@/components/audio-card";

export const dynamic = "force-dynamic";

export default async function AudioStoriesPage() {
  const list = await getAudioStories();

  return (
    <Container className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Audio Stories</h1>
        <p className="text-sm text-gray-600">
          Play stories and listen together with your child.
        </p>
      </div>

      {list.length === 0 && (
        <p className="text-sm text-gray-500">No stories yet.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((s) => (
          <AudioCard key={s.id} story={s} />
        ))}
      </div>
    </Container>
  );
}
