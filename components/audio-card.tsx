import { Link } from "@/i18n/routing";
import { Card } from "@/ui/card";
import type { AudioStory } from "@/types/content";

export function AudioCard({ story }: { story: AudioStory }) {
  return (
    <Link href={`/audio-stories/${story.slug}`}>
      <Card className="hover:shadow-md cursor-pointer space-y-2">
        <h3 className="font-semibold text-gray-900">{story.title}</h3>
        <p className="text-xs text-gray-500">{story.duration}</p>
        <p className="text-sm text-gray-600 line-clamp-2">{story.description}</p>
      </Card>
    </Link>
  );
}
