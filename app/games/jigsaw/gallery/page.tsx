import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/ui/container';
import { JIGSAW_IMAGES, JIGSAW_DIFFICULTIES } from '../jigsawConfig';

export default function JigsawGalleryPage() {
  return (
    <Container className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Пазлы</h1>
        <p className="text-sm text-gray-600">
          Выберите картинку и сложность, а потом собирайте пазл.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {JIGSAW_IMAGES.map((img) => (
          <article
            key={img.id}
            className="rounded-xl bg-white shadow-md overflow-hidden flex flex-col border border-gray-100"
          >
            <div className="aspect-[4/3] relative bg-gray-100">
              <Image
                src={img.src}
                alt={img.label}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            <div className="p-4 flex flex-col gap-3">
              <h2 className="text-base font-semibold text-gray-900">
                {img.label}
              </h2>

              <div className="flex flex-wrap gap-2">
                {JIGSAW_DIFFICULTIES.map((d) => (
                  <Link
                    key={d.gridSize}
                    href={`/games/jigsaw?image=${img.id}&size=${d.gridSize}`}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Container>
  );
}

