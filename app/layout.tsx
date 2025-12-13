import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: "Kids Park Club – Coloring Pages and Games",
  description: "Kids platform with coloring pages and mini-games.",
  openGraph: {
    title: "Kids Park Club",
    description: "Coloring pages and games in one place.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col app-background">
        <Navbar />
        <main className="flex-1 relative">{children}</main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}
