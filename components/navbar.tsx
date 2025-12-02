"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = supabaseBrowser();

    // 1. Загружаем юзера при первом рендере
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // 2. Реагируем на login / logout СРАЗУ
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const links = [
    { href: "/", label: "Главная" },
    { href: "/coloring", label: "Разукраски" },
    { href: "/games", label: "Игры" },
  ];

  // Показывать админ только тебе
  if (user?.email === "polyatskiy@gmail.com") {
    links.push({ href: "/admin", label: "Админ" });
  }

  return (
    <nav className="p-4 bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Kids Park Club
        </Link>

        <div className="flex gap-6 items-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href ? "text-blue-500 font-semibold" : ""
              }
            >
              {link.label}
            </Link>
          ))}

          {/* Пока грузим — ничего не показывать, чтобы не мигало */}
          {loading ? null : (
            <>
              {!user && (
                <Link href="/auth/login" className="text-blue-600">
                  Войти
                </Link>
              )}

              {user && (
                <button onClick={handleLogout} className="text-red-600">
                  Выйти
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
