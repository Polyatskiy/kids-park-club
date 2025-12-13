import { Container } from "@/ui/container";
import ColoringBrowser from "@/components/coloring-browser";
import { BackArrow } from "@/components/back-arrow";

export const dynamic = "force-dynamic";

export default async function ColoringPage() {
  return (
    <>
      <BackArrow />
      <Container className="pt-20 md:pt-24 pb-8">
        <ColoringBrowser />
      </Container>
    </>
  );
}
