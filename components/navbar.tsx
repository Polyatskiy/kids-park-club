"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useNavigation } from "@/lib/useNavigation";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/ui/button";

export function Navbar() {
  const { user, loading, handleLogout, isAdmin } = useNavigation();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const t = useTranslations("common");

  // Detect if we're on a "root" page (no back button)
  const isRoot =
    pathname === "/" ||
    /^\/[a-z]{2}$/.test(pathname); // e.g. "/en", "/pl"

  // Back button is shown on all non-root pages
  const showBack = !isRoot;

  // Jigsaw routes still use slightly larger logo sizing
  const isJigsawRoute = pathname.includes("/games/jigsaw");

  const navPaddingX = showBack ? "px-3 md:px-4" : "px-4 md:px-5";
  const navPaddingY = showBack ? "py-1 md:py-1.5" : "py-1.5 md:py-2";
  const rightClasses = "flex items-center gap-2.5 md:gap-3";
  const containerPadding = "pl-2 md:pl-3";

  // Compact logo wrapper: высота шапки определяется nav, логотип вписывается внутрь
  const logoWrapperClasses = isJigsawRoute
    ? "relative w-[132px] h-10 md:w-[160px] md:h-12 drop-shadow-lg"
    : "relative w-[120px] h-9 md:w-[150px] md:h-11 drop-shadow-lg";
  // Remove left offset/margin to eliminate empty space - logo starts immediately
  const logoOffset = "";
  const logoLift = isJigsawRoute ? "-translate-y-[4px]" : "";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 ${navPaddingX} ${navPaddingY}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between rounded-2xl bg-surface/92 backdrop-blur-md border border-border shadow-soft px-3 py-1 md:px-4 md:py-1.5">
          <div className={`flex items-center gap-2 md:gap-3 ${containerPadding} relative`}>
            {showBack && (
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-surface-muted border border-border text-slate-800 shadow-soft hover:bg-surface hover:shadow-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Go back"
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Logo - Left Side */}
            <Link
              href="/"
              className={`flex items-center navbar-logo ${logoOffset} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
            >
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
          </div>

          {/* Right Side - Language Switcher + Admin + Auth */}
          <div className={rightClasses}>
            <LanguageSwitcher />

            {isAdmin && (
              <Link href="/admin">
                <Button variant="secondary" className="px-3 md:px-4 text-xs md:text-sm">
                  {t("admin")}
                </Button>
              </Link>
            )}

            {!loading && (
              <>
                {!user ? (
                  <Link href="/auth/login">
                    <Button className="px-3 md:px-4 text-xs md:text-sm">
                      {t("login")}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="destructive"
                    className="px-3 md:px-4 text-xs md:text-sm"
                    onClick={handleLogout}
                  >
                    {t("logout")}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}




