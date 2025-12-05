"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/lib/useNavigation";

export function Navbar() {
  const pathname = usePathname();
  
  // Use shared navigation hook
  const { user, loading, links, handleLogout } = useNavigation();

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
