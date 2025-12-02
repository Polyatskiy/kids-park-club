import Link from "next/link";

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
      className="block rounded-xl overflow-hidden border bg-white shadow hover:shadow-lg transition-shadow"
    >
      <div className="w-full h-40 bg-white rounded-lg border flex items-center justify-center overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={item.thumbnail_url || "/placeholder.png"}
            alt={item.title}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <div className="p-3">
        <div className="font-semibold text-gray-800">{item.title}</div>
        <div className="text-xs mt-1 text-gray-500">
          {item.category} • {item.subcategory}
        </div>
      </div>
    </Link>
  );
}
