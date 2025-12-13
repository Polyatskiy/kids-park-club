import { Container } from "@/ui/container";

export function Footer() {
  return (
    <footer className="mt-auto">
      <Container className="py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-600">
        <span>© {new Date().getFullYear()} Kids Park Club</span>
        <span>Coloring pages and games for kids</span>
      </Container>
    </footer>
  );
}
