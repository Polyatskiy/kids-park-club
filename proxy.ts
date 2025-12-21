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

  // Add Content Security Policy headers to protect against XSS attacks
  // Reference: https://web.dev/articles/csp
  // 
  // Security considerations:
  // - 'unsafe-inline' and 'unsafe-eval' weaken CSP but are necessary for:
  //   * Google Analytics (requires eval for dynamic code execution)
  //   * Vercel Speed Insights (may use eval)
  //   * Next.js inline scripts and React hydration
  //   * Next.js HMR in development mode
  // 
  // Future improvements (if needed):
  // - Use nonce-based CSP for inline scripts (requires passing nonce through component tree)
  // - Consider using hash-based CSP for specific inline scripts
  // - Move Google Analytics to server-side tracking if possible
  const isDev = process.env.NODE_ENV === 'development';
  
  // Build CSP directives
  // Script sources: allow necessary third-party scripts
  const scriptSrc = [
    "'self'", // Allow scripts from same origin
    "'unsafe-inline'", // Required for: Next.js inline scripts, React hydration, gtag init
    "https://www.googletagmanager.com", // Google Analytics
    "https://www.google-analytics.com", // Google Analytics
    "https://*.supabase.co", // Supabase client library
    "https://va.vercel-scripts.com", // Vercel Speed Insights
    "'unsafe-eval'", // Required for: Google Analytics, Vercel Speed Insights, Next.js HMR (dev)
  ].join(' ');

  // Connect sources: allow fetch/XHR to external APIs
  const connectSrc = [
    "'self'",
    "https://*.supabase.co", // Supabase API
    "https://www.google-analytics.com", // Google Analytics
    "https://www.googletagmanager.com", // Google Tag Manager
    "https://*.vercel-analytics.com", // Vercel Analytics
    "https://vitals.vercel-insights.com", // Vercel Speed Insights
  ].join(' ');

  // Image sources: allow images from various sources
  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https:", // Allow all HTTPS images (for Supabase storage, external images)
  ].join(' ');

  // Font sources
  const fontSrc = [
    "'self'",
    "https://fonts.gstatic.com",
    "data:",
  ].join(' ');

  // Style sources
  // Note: 'unsafe-inline' is required because Tailwind CSS generates utility classes
  // as inline styles. This is standard for Tailwind and doesn't significantly reduce security.
  const styleSrc = [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS utility classes
    "https://fonts.googleapis.com", // Google Fonts CSS
  ].join(' ');

  // Build CSP header with report-uri for monitoring violations
  // In development, you can use report-only mode to test policies
  const reportUri = isDev ? undefined : '/api/csp-report'; // Optional: endpoint for CSP violation reports
  
  const cspDirectives = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `font-src ${fontSrc}`,
    `img-src ${imgSrc}`,
    `connect-src ${connectSrc}`,
    `frame-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ];
  
  // Add report-uri if in production (optional, for monitoring CSP violations)
  // Uncomment the following line and create /api/csp-report endpoint if you want to monitor violations
  // if (reportUri) {
  //   cspDirectives.push(`report-uri ${reportUri}`);
  // }
  
  const cspHeader = cspDirectives.join('; ');

  // Set security headers
  // Content-Security-Policy: Primary defense against XSS attacks
  response.headers.set('Content-Security-Policy', cspHeader);
  // X-Content-Type-Options: Prevents MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // X-Frame-Options: Prevents clickjacking by blocking iframe embedding
  response.headers.set('X-Frame-Options', 'DENY');
  // X-XSS-Protection: Legacy XSS protection (modern browsers use CSP, but doesn't hurt)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer-Policy: Controls referrer information sent with requests
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

