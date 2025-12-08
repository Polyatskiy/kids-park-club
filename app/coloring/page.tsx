import { Container } from "@/ui/container";
import ColoringBrowser from "@/components/coloring-browser";
import { BackArrow } from "@/components/back-arrow";

export const dynamic = "force-dynamic";

export default async function ColoringPage() {
  return (
    <>
      <BackArrow />
      <Container className="pt-16 md:pt-20 pb-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-gray-900">Разукрашки</h1>
          <p className="text-sm text-gray-600">
            Выберите категорию (машины, животные, персонажи и др.), затем при
            необходимости подкатегорию. Нажмите на картинку, чтобы открыть и
            скачать.
          </p>
        </div>

        <ColoringBrowser />
      </Container>
    </>
  );
}
