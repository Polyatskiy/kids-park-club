import { Container } from "@/ui/container";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-10">
      <Container className="py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
        <span>© {new Date().getFullYear()} Kids Fun Hub</span>
        <span>Сказки, разукраски и игры для детей</span>
      </Container>
    </footer>
  );
}
