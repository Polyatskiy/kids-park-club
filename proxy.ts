import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_EMAIL = "polyatskiy@gmail.com";
const SUPPORTED_LOCALES = ["en", "pl", "ru", "uk"];
const DEFAULT_LOCALE = "en";
const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

// Helper to detect locale from Accept-Language header
function detectLocaleFromHeader(acceptLanguage: string | null): string {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [locale, q = "1"] = lang.trim().split(";q=");
      // Extract base locale (e.g., "en" from "en-US" or "en-GB")
      const baseLocale = locale.split("-")[0].toLowerCase();
      return { locale: baseLocale, quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // First, try to find an exact match in supported locales
  for (const { locale } of languages) {
    if (SUPPORTED_LOCALES.includes(locale)) {
      return locale;
    }
  }

  // If no exact match, check for English variants (en-US, en-GB, etc.)
  // These should map to 'en'
  for (const { locale } of languages) {
    if (locale === 'en' || locale.startsWith('en-')) {
      return DEFAULT_LOCALE; // Return 'en' as default locale
    }
  }

  return DEFAULT_LOCALE;
}

// Helper to get locale from URL pathname
// Returns the FIRST locale found, ignoring any stacked locales
function getLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  
  const firstSegment = segments[0];
  if (firstSegment && SUPPORTED_LOCALES.includes(firstSegment)) {
    return firstSegment;
  }
  return null;
}

// Helper to clean path by removing ALL locale prefixes
function cleanPathFromLocales(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const localeSet = new Set(SUPPORTED_LOCALES);
  
  // Find first non-locale segment
  let firstNonLocaleIndex = segments.length;
  for (let i = 0; i < segments.length; i++) {
    if (!localeSet.has(segments[i])) {
      firstNonLocaleIndex = i;
      break;
    }
  }
  
  const cleanSegments = segments.slice(firstNonLocaleIndex);
  return cleanSegments.length > 0 ? '/' + cleanSegments.join('/') : '/';
}

export async function proxy(req: NextRequest) {
  let response = NextResponse.next();
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Skip locale detection for static files, API routes, Next.js internals, and special routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return response;
  }

  // Detect locale: URL prefix -> cookie -> Accept-Language -> default
  let locale: string | null = getLocaleFromPath(pathname);
  
  if (!locale) {
    // Check cookie
    const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
      locale = cookieLocale;
    } else {
      // Check Accept-Language header (only on first visit, no cookie)
      locale = detectLocaleFromHeader(req.headers.get("accept-language"));
    }
  }

  // Ensure we have a valid locale
  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE;
  }

  // Set locale cookie if not already set or different
  const currentCookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (currentCookieLocale !== locale) {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  // If locale is in URL and it's the default locale, we don't need to redirect
  // (because localePrefix is 'as-needed', en has no prefix)
  const urlLocale = getLocaleFromPath(pathname);
  
  // CRITICAL: Check for stacked locales (e.g., /ru/pl/coloring) and redirect to clean path
  const segments = pathname.split("/").filter(Boolean);
  const localeSet = new Set(SUPPORTED_LOCALES);
  let localeCount = 0;
  for (const segment of segments) {
    if (localeSet.has(segment)) {
      localeCount++;
    } else {
      break; // Stop counting once we hit a non-locale segment
    }
  }
  
  // If we have multiple consecutive locale segments, clean them up
  if (localeCount > 1) {
    const cleanPath = cleanPathFromLocales(pathname);
    const newPath = locale === DEFAULT_LOCALE 
      ? cleanPath 
      : `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
    url.pathname = newPath;
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set("x-proxy-hit", "1");
    redirectResponse.headers.set("x-locale", locale);
    if (currentCookieLocale !== locale) {
      redirectResponse.cookies.set(LOCALE_COOKIE_NAME, locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return redirectResponse;
  }
  
  // With 'always' strategy, all locales including 'en' must have prefix
  // If user is accessing root or a path without locale prefix, redirect to prefixed version
  if (!urlLocale) {
    // Preserve the pathname and add locale prefix
    const newPath = `/${locale}${pathname === "/" ? "" : pathname}`;
    url.pathname = newPath;
    const redirectResponse = NextResponse.redirect(url);
    // Copy cookie setting to redirect response
    if (currentCookieLocale !== locale) {
      redirectResponse.cookies.set(LOCALE_COOKIE_NAME, locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    redirectResponse.headers.set("x-proxy-hit", "1");
    redirectResponse.headers.set("x-locale", locale);
    return redirectResponse;
  }

  // Создаём серверный клиент Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // New, non-deprecated cookie interface for @supabase/ssr
        getAll() {
          return req.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Получаем session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Защита маршрута /admin/* (considering locale prefix)
  // Check if path is /admin or /{locale}/admin
  const isAdminPath = pathname === "/admin" || 
                      pathname.startsWith("/admin/") ||
                      (urlLocale && (pathname === `/${urlLocale}/admin` || pathname.startsWith(`/${urlLocale}/admin/`)));
  
  if (isAdminPath) {
    // 1) Нет сессии → логин
    if (!session) {
      // Preserve locale in login redirect
      const loginPath = urlLocale ? `/${urlLocale}/auth/login` : "/auth/login";
      url.pathname = loginPath;
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set("x-proxy-hit", "1");
      redirectResponse.headers.set("x-locale", locale);
      return redirectResponse;
    }

    // 2) Не администратор → домой
    if (session.user.email !== ADMIN_EMAIL) {
      // Preserve locale in home redirect
      const homePath = urlLocale ? `/${urlLocale}` : "/";
      url.pathname = homePath;
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.headers.set("x-proxy-hit", "1");
      redirectResponse.headers.set("x-locale", locale);
      return redirectResponse;
    }
  }

  // Add debug header and locale header for root layout
  // CRITICAL: Always set x-locale header, even when no prefix in URL
  // This ensures Next.js can properly route to app/[locale]/... structure
  // For default locale (en) without prefix, locale is still 'en'
  response.headers.set("x-proxy-hit", "1");
  response.headers.set("x-locale", locale);
  return response;
}

// Robust matcher: all routes except Next.js internals, API, and static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)",
  ],
};
