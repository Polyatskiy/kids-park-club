import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const ADMIN_EMAIL = "polyatskiy@gmail.com";

// Create next-intl middleware
const intlMiddleware = createMiddleware(routing);

export async function proxy(req: NextRequest) {
  // Exclude metadata routes (sitemap.xml, robots.txt, etc.) from locale routing
  const pathname = req.nextUrl.pathname;
  
  // Allow metadata routes to pass through without locale processing
  if (
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Let next-intl handle locale routing FIRST
  // This is critical: next-intl needs to rewrite URLs internally for Next.js routing
  // With 'as-needed', / becomes /en internally (URL stays /, but Next.js sees /en)
  const response = intlMiddleware(req);
  
  // If next-intl returned a redirect, return it immediately
  if (response.status === 307 || response.status === 308) {
    return response;
  }
  
  // Get the pathname (after next-intl's internal rewrite)
  const segments = pathname.split('/').filter(Boolean);
  
  // Determine locale from the path (after rewrite)
  const urlLocale = segments[0] && routing.locales.includes(segments[0] as any)
    ? segments[0]
    : routing.defaultLocale;

  // Check if this is an admin path (after next-intl rewrite)
  const isAdminPath = pathname.includes('/admin');

  if (isAdminPath) {
    // Create Supabase client for auth check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      // Redirect to login, preserving locale
      const loginPath = urlLocale === routing.defaultLocale
        ? '/auth/login'
        : `/${urlLocale}/auth/login`;
      const url = req.nextUrl.clone();
      url.pathname = loginPath;
      return NextResponse.redirect(url);
    }

    if (user.email !== ADMIN_EMAIL) {
      // Redirect to home, preserving locale
      const homePath = urlLocale === routing.defaultLocale ? '/' : `/${urlLocale}`;
      const url = req.nextUrl.clone();
      url.pathname = homePath;
      return NextResponse.redirect(url);
    }
  }

  // Add Content Security Policy headers to resolve CSP eval warnings
  // In development, Next.js uses eval for HMR, so we allow it only in dev mode
  // In production, Next.js doesn't use eval, so we can have stricter CSP
  const isDev = process.env.NODE_ENV === 'development';
  
  // Build CSP directive
  // Allow unsafe-eval only in development for Next.js HMR
  // In production, this should not be needed
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'", // Required for inline scripts (Next.js, React)
    "https://www.googletagmanager.com", // Google Analytics
    "https://www.google-analytics.com", // Google Analytics
    "https://*.supabase.co", // Supabase
    ...(isDev ? ["'unsafe-eval'"] : []), // Only allow eval in development for HMR
  ].join(' ');

  const cspHeader = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Tailwind uses inline styles
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.vercel-analytics.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  // Clone response headers and add CSP
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// Robust matcher: all routes except Next.js internals, API, static files, and metadata routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml, robots.txt (metadata routes)
     * - static files (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)",
  ],
};

