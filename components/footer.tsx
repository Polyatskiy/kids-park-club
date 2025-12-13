"use client";

import { Container } from "@/ui/container";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("common.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      <Container className="py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-600">
        <span>{t("copyright", { year })}</span>
        <span>{t("tagline")}</span>
      </Container>
    </footer>
  );
}
