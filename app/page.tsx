import { Container } from "@/ui/container";
import { SectionCard } from "@/components/section-card";
import Link from "next/link";

const sections = [
  {
    href: "/coloring",
    title: "Разукраски",
    description: "Чёрно-белые картинки, которые можно распечатать и раскрасить.",
  },
  //{
   // href: "/audio-stories",
    //title: "Аудиосказки",
    //description: "Слушайте сказки прямо на сайте.",
    //badge: "2 аудио"
  //},
  //{
    //href: "/books",
    //title: "Книги",
    //description: "Детские рассказики и сказки для чтения.",
    //badge: "2 книги"
  //},
  {
    href: "/games",
    title: "Мини-игры",
    description: "Реакция, пазлы и другие простые игры.",
  }
];

export default function HomePage() {
  return (
    <Container className="py-10 space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
          Добро пожаловать в <span className="text-primary">Kids Park Club</span>
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Разукраски и мини-игры в одном месте. Для детей и родителей.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/coloring" className="inline-block">
            <button className="px-5 py-3 rounded-2xl bg-primary text-gray-900 font-semibold shadow-md">
              Перейти к разукрашкам
            </button>
          </Link>
          <Link href="/games" className="inline-block">
            <button className="px-5 py-3 rounded-2xl bg-secondary text-gray-900 font-semibold shadow-md">
            Играть в игры
            </button>
          </Link>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <SectionCard key={s.href} {...s} />
        ))}
      </section>
    </Container>
  );
}
