"use client";

import Link from "next/link";
import Image from "next/image";
import { useNavigation } from "@/lib/useNavigation";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { user, loading, handleLogout, isAdmin } = useNavigation();
  const pathname = usePathname();

  const isJigsawRoute = pathname?.startsWith("/games/jigsaw");
  const navPaddingX = isJigsawRoute ? "px-4 md:px-6" : "px-5 md:px-8";
  const navPaddingY = isJigsawRoute ? "py-3 md:py-4" : "py-4 md:py-5";
  const rightClasses = isJigsawRoute ? "flex items-center gap-3 md:gap-4 absolute right-4 top-3 md:right-6 md:top-4 z-50" : "flex items-center gap-3 md:gap-4";
  const containerPadding = isJigsawRoute ? "pl-4 md:pl-6" : "pl-12 md:pl-16";
  const logoWrapperClasses = isJigsawRoute
    ? "relative w-[150px] h-[60px] md:w-[220px] md:h-[82px] drop-shadow-lg"
    : "relative w-[130px] h-[52px] md:w-[200px] md:h-[72px] drop-shadow-lg";
  const logoOffset = isJigsawRoute ? "-ml-1" : "";
  const logoLift = isJigsawRoute ? "-translate-y-[4px]" : "";

  return (
    <nav className={`absolute top-0 left-0 right-0 z-50 ${navPaddingX} ${navPaddingY} relative`}>
      <div className={`max-w-7xl mx-auto flex items-center justify-between ${containerPadding} relative`}>
        {/* Logo - Left Side */}
        <Link href="/" className={`flex items-center navbar-logo ${logoOffset}`}>
          <div className={`${logoWrapperClasses} flex items-center ${logoLift}`}>
            <Image
              src="/assets/logo.png"
              alt="Kids Park Club"
              fill
              className="object-contain drop-shadow-lg"
              priority
              sizes="200px"
            />
          </div>
        </Link>

        {/* Right Side - Auth Button + Admin Link */}
        <div className={rightClasses}>
          {/* Admin link for admins */}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-white/90 hover:text-white transition-colors drop-shadow-md"
            >
              Admin
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
                  Login
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 md:px-5 md:py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium rounded-full transition-all text-sm md:text-base"
                >
                  Logout
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}




