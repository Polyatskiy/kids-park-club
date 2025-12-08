import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: "Kids Park Club – разукраски и игры",
  description: "Детская платформа с разукрасками и мини-играми.",
  openGraph: {
    title: "Kids Park Club",
    description: "Разукраски и игры в одном месте.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col app-background">
        <Navbar />
        <main className="flex-1 relative">{children}</main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}
