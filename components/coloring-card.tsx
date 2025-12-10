import Link from "next/link";
import Image from "next/image";

type ColoringItem = {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  thumbnail_url: string;
};

type Props = {
  item: ColoringItem;
};

export default function ColoringCard({ item }: Props) {
  return (
    <Link
      href={`/coloring/${item.slug}`}
      className="block rounded-2xl overflow-hidden border border-white/30 bg-white/20 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.2)] transition-shadow"
    >
      <div className="w-full relative aspect-[4/3] bg-white/30 flex items-center justify-center overflow-hidden">
        <Image
          src={item.thumbnail_url || "/placeholder.png"}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <div className="p-3">
        <div
          className="font-semibold text-white text-sm md:text-base"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.25)" }}
        >
          {item.title}
        </div>
        <div className="text-xs mt-1 text-white/90">
          {item.category} • {item.subcategory}
        </div>
      </div>
    </Link>
  );
}
