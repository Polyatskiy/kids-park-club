"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useNavigation } from "@/lib/useNavigation";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/ui/button";

export function Navbar() {
  const { user, loading, handleLogout, isAdmin, links } = useNavigation();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const t = useTranslations("common");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detect if we're on a "root" page (no back button)
  const isRoot =
    pathname === "/" ||
    /^\/[a-z]{2}$/.test(pathname); // e.g. "/en", "/pl"

  // Back button is shown on all non-root pages
  const showBack = !isRoot;

  // Jigsaw routes still use slightly larger logo sizing
  const isJigsawRoute = pathname.includes("/games/jigsaw");

  const navPaddingX = showBack ? "px-2 md:px-3" : "px-3 md:px-4";
  const navPaddingY = showBack ? "py-0.5 md:py-1" : "py-1 md:py-1.5";
  const rightClasses = "flex items-center gap-2.5 md:gap-3";
  const containerPadding = "pl-1 md:pl-1.5";

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
        <div className="flex items-center justify-between rounded-2xl bg-surface/92 backdrop-blur-md border border-border shadow-soft px-2 py-0.5 md:px-3 md:py-1">
          <div className={`flex items-center gap-1 md:gap-1.5 ${containerPadding} relative`}>
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
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2.5 md:gap-3">
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

            {/* Mobile hamburger */}
            <button
              type="button"
              className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-full bg-surface-muted border border-border text-slate-800 shadow-soft hover:bg-surface hover:shadow-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">{isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}</span>
              <div className="relative w-5 h-5">
                {/* Hamburger lines */}
                <span
                  className={`absolute top-0 left-0 w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                    isMobileMenuOpen ? "rotate-45 top-2.5" : ""
                  }`}
                />
                <span
                  className={`absolute top-2.5 left-0 w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                    isMobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute top-5 left-0 w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                    isMobileMenuOpen ? "-rotate-45 top-2.5" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop with fade-in */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Panel with slide-in animation */}
          <div className="absolute top-0 right-0 h-full w-72 max-w-[85%] bg-surface shadow-strong border-l border-border flex flex-col rounded-tl-2xl rounded-bl-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <span className="text-sm font-semibold text-slate-900">
                {t("menu")}
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-muted hover:bg-surface hover:shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Close menu"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-900 hover:bg-surface-muted hover:shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>{link.label}</span>
                </Link>
              ))}

              {/* Language section */}
              <div className="mt-3 border-t border-border pt-3">
                <span className="block text-xs font-semibold text-muted-foreground mb-2 px-3">
                  {t("language") || "Language"}
                </span>
                <div className="px-3">
                  <LanguageSwitcher />
                </div>
              </div>
            </nav>

            {/* Footer with auth button */}
            <div className="border-t border-border px-3 py-3 bg-surface-muted/30">
              {!loading && (
                <>
                  {!user ? (
                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full justify-center">
                        {t("login")}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="destructive"
                      className="w-full justify-center"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      {t("logout")}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}




