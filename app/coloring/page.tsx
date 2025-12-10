import { Container } from "@/ui/container";
import ColoringBrowser from "@/components/coloring-browser";
import { BackArrow } from "@/components/back-arrow";

export const dynamic = "force-dynamic";

export default async function ColoringPage() {
  return (
    <>
      <BackArrow />
      <Container className="pt-20 md:pt-24 pb-8 space-y-6">
        <div className="inline-flex flex-col gap-1 px-4 py-3 rounded-2xl bg-white/30 backdrop-blur-[14px] shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
          <h1 className="text-2xl md:text-3xl font-bold text-[#222]">Разукрашки</h1>
          <p className="text-sm md:text-base text-[#333]">
            Выберите категорию (машины, животные, персонажи и др.), затем при необходимости подкатегорию. Нажмите на картинку, чтобы открыть и скачать.
          </p>
        </div>

        <ColoringBrowser />
      </Container>
    </>
  );
}
