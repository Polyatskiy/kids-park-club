import { Container } from "@/ui/container";
import Link from "next/link";
import { BackArrow } from "@/components/back-arrow";

export default function PopularPage() {
  return (
    <>
      <BackArrow />
      <Container className="pt-16 md:pt-20 pb-8">
        <div className="bg-white/25 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-[0_14px_36px_rgba(0,0,0,0.18)] text-center max-w-2xl mx-auto">
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
          >
            ⭐ Popular
          </h1>
          <p className="text-white/90 text-lg mb-8">
            The most popular coloring pages and games will appear here soon!
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-white/25 border border-white/40 hover:bg-white/35 text-white font-semibold rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-all hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
            style={{ textShadow: "0 2px 6px rgba(0,0,0,0.25)" }}
          >
            Home
          </Link>
        </div>
      </Container>
    </>
  );
}
