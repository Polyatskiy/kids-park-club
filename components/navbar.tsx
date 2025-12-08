"use client";

import Link from "next/link";
import Image from "next/image";
import { useNavigation } from "@/lib/useNavigation";

export function Navbar() {
  const { user, loading, handleLogout, isAdmin } = useNavigation();

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-4 py-4 md:px-6 md:py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo - Left Side */}
        <Link href="/" className="flex items-center">
          <div className="relative w-[100px] h-[40px] md:w-[140px] md:h-[50px]">
            <Image
              src="/assets/logo.png"
              alt="Kids Park Club"
              fill
              className="object-contain drop-shadow-lg"
              priority
              sizes="140px"
            />
          </div>
        </Link>

        {/* Right Side - Auth Button + Admin Link */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Admin link for admins */}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-white/90 hover:text-white transition-colors drop-shadow-md"
            >
              Админ
            </Link>
          )}

          {/* Auth Button */}
          {loading ? null : (
            <>
              {!user ? (
                <Link
                  href="/auth/login"
                  className="px-4 py-2 md:px-5 md:py-2.5 bg-[#FF6B9D] hover:bg-[#FF5A8A] text-white font-semibold rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 text-sm md:text-base"
                  style={{
                    boxShadow: "0 4px 15px rgba(255, 107, 157, 0.4)"
                  }}
                >
                  Войти
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 md:px-5 md:py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium rounded-full transition-all text-sm md:text-base"
                >
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
