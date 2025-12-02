import { Container } from "@/ui/container";
import { getColoringList } from "@/lib/content-repository";
import ColoringBrowser from "@/components/coloring-browser";

export const dynamic = "force-dynamic";

export default async function ColoringPage() {
  const list = await getColoringList();

  return (
    <Container className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Разукрашки</h1>
        <p className="text-sm text-gray-600">
          Выберите категорию (машины, животные, персонажи и др.), затем при
          необходимости подкатегорию. Нажмите на картинку, чтобы открыть и
          скачать.
        </p>
      </div>

      <ColoringBrowser />
    </Container>
  );
}
