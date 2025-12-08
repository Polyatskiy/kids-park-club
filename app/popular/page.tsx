import { Container } from "@/ui/container";
import Link from "next/link";
import { BackArrow } from "@/components/back-arrow";

export default function PopularPage() {
  return (
    <>
      <BackArrow />
      <Container className="pt-16 md:pt-20 pb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ⭐ Популярное
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Скоро здесь появятся самые популярные разукраски и игры!
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-gray-800 font-semibold rounded-full shadow-md transition-all hover:shadow-lg"
          >
            На главную
          </Link>
        </div>
      </Container>
    </>
  );
}
