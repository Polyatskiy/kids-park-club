"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useNavigation } from "@/lib/useNavigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Navbar() {
  const { user, loading, handleLogout, isAdmin } = useNavigation();
  const pathname = usePathname();
  const t = useTranslations("common");

  const isJigsawRoute = pathname?.startsWith("/games/jigsaw");
  const navPaddingX = isJigsawRoute ? "px-4 md:px-6" : "px-5 md:px-8";
  const navPaddingY = isJigsawRoute ? "py-3 md:py-4" : "py-4 md:py-5";
  const rightClasses = isJigsawRoute ? "flex items-center gap-3 md:gap-4 absolute right-4 top-3 md:right-6 md:top-4 z-50" : "flex items-center gap-3 md:gap-4";
  // Logo positioned next to back arrow - same close distance on all screen sizes
  // Mobile: pl-29 (116px), md+: same relative distance to maintain same visual gap
  const containerPadding = isJigsawRoute ? "pl-4 md:pl-6" : "pl-29 md:pl-29";
  // Logo sizes increased by 30% (1.3x scale)
  // Regular: 130*1.3=169, 52*1.3=68, md: 200*1.3=260, 72*1.3=94
  // Jigsaw: 150*1.3=195, 60*1.3=78, md: 220*1.3=286, 82*1.3=107
  const logoWrapperClasses = isJigsawRoute
    ? "relative w-[195px] h-[78px] md:w-[286px] md:h-[107px] drop-shadow-lg"
    : "relative w-[169px] h-[68px] md:w-[260px] md:h-[94px] drop-shadow-lg";
  // Remove left offset/margin to eliminate empty space - logo starts immediately
  const logoOffset = "";
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
              sizes="(max-width: 768px) 195px, 286px"
            />
          </div>
        </Link>

        {/* Right Side - Language Switcher + Auth Button + Admin Link */}
        <div className={rightClasses}>
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Admin link for admins */}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-white/90 hover:text-white transition-colors drop-shadow-md"
            >
              {t("admin")}
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
                  {t("login")}
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 md:px-5 md:py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium rounded-full transition-all text-sm md:text-base"
                >
                  {t("logout")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}




