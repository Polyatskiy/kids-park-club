import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const ADMIN_EMAIL = "polyatskiy@gmail.com";

// Create next-intl middleware.
// Built-in localeDetection is disabled via `config.localeDetection = false`
// at the bottom of this file – we implement our own logic here instead so that
// we have full control over:
// - FIRST: previously chosen locale (cookie)
// - THEN: Accept-Language header
// - FINALLY: fallback to defaultLocale ("en")
const intlMiddleware = createMiddleware(routing);

const SUPPORTED_LOCALES = routing.locales;
const DEFAULT_LOCALE = routing.defaultLocale;

function detectLocaleFromAcceptLanguage(headerValue: string | null): string {
  if (!headerValue) {
    return DEFAULT_LOCALE;
  }

  type Candidate = { lang: string; quality: number; index: number };
  const candidates: Candidate[] = [];

  headerValue.split(",").forEach((part, index) => {
    const [langRaw, qRaw] = part.trim().split(";q=");
    const lang = langRaw.toLowerCase();
    if (!lang) return;

    const quality = qRaw ? parseFloat(qRaw) || 0 : 1;
    candidates.push({ lang, quality, index });
  });

  if (candidates.length === 0) {
    return DEFAULT_LOCALE;
  }

  // Sort by quality (q) desc, then by original order
  candidates.sort((a, b) => {
    if (b.quality !== a.quality) return b.quality - a.quality;
    return a.index - b.index;
  });

  // Requirement: exact match -> base language -> fallback to en
  for (const candidate of candidates) {
    const lang = candidate.lang;

    // Try exact match first (e.g. "en", "ru", "pl", "uk")
    if (SUPPORTED_LOCALES.includes(lang as any)) {
      return lang;
    }

    // Then try by base language (e.g. "en-US" -> "en")
    const base = lang.split("-")[0];
    if (SUPPORTED_LOCALES.includes(base as any)) {
      return base;
    }
  }

  return DEFAULT_LOCALE;
}

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

  // Explicitly redirect /en/ and /en to / (root) to prevent duplicate content issues
  // This ensures Google always sees the same canonical URL for the default locale
  if (pathname === '/en' || pathname === '/en/') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url, 301); // Permanent redirect
  }

  // Locale handling:
  // 1) If URL already contains a locale prefix (/pl, /ru, /uk), keep it as is.
  // 2) Otherwise:
  //    - If NEXT_LOCALE cookie is present and valid, use it.
  //    - Else detect from Accept-Language with our custom algo.
  //    - If detected locale is not default ("en"), redirect to /{locale}...
  //    - Always persist the chosen locale in NEXT_LOCALE cookie.
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  const hasLocalePrefix = firstSegment && SUPPORTED_LOCALES.includes(firstSegment as any);

  const localeCookie = req.cookies.get('NEXT_LOCALE')?.value;
  let effectiveLocale: string = DEFAULT_LOCALE;

  if (localeCookie && SUPPORTED_LOCALES.includes(localeCookie as any)) {
    effectiveLocale = localeCookie;
  } else {
    const acceptLanguage = req.headers.get('accept-language');
    effectiveLocale = detectLocaleFromAcceptLanguage(acceptLanguage);
  }

  // If there is no locale prefix in the URL, decide whether we should redirect
  // to a prefixed path (for non-default locales) or stay on the current path (for EN).
  if (!hasLocalePrefix) {
    // For non-default locales, redirect /foo -> /{locale}/foo
    if (effectiveLocale !== DEFAULT_LOCALE) {
      const url = req.nextUrl.clone();
      const cleanPath =
        pathname === '/' ? '' : pathname; // keep sub-paths for redirect
      url.pathname =
        cleanPath === ''
          ? `/${effectiveLocale}`
          : `/${effectiveLocale}${cleanPath}`;

      const res = NextResponse.redirect(url);
      res.cookies.set('NEXT_LOCALE', effectiveLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
      return res;
    }
  }

  // Let next-intl handle locale routing FIRST
  // This is critical: next-intl needs to rewrite URLs internally for Next.js routing
  // With 'as-needed', / becomes /en internally (URL stays /, but Next.js sees /en)
  const response = intlMiddleware(req);

  // Ensure we persist the resolved locale in cookie, even when URL already
  // contains a prefix or we decided to stay on default locale.
  if (!localeCookie && effectiveLocale) {
    response.cookies.set('NEXT_LOCALE', effectiveLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }
  
  // If next-intl returned a redirect, return it immediately
  if (response.status === 307 || response.status === 308) {
    return response;
  }
  
  // Determine locale from the path for admin redirects.
  // We can safely reuse the earlier `segments` value here.
  const urlLocale = hasLocalePrefix ? (firstSegment as string) : routing.defaultLocale;

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
    "https://vercel.live", // Vercel Live Feedback (development/preview)
    "'unsafe-eval'", // Required for: Google Analytics, Vercel Speed Insights, Next.js HMR (dev)
  ].join(' ');

  // Connect sources: allow fetch/XHR to external APIs
  const connectSrc = [
    "'self'",
    "https://*.supabase.co", // Supabase API
    "https://www.google-analytics.com", // Google Analytics
    "https://www.googletagmanager.com", // Google Tag Manager
    "https://*.google-analytics.com", // Google Analytics (all regions, including region1, region2, etc.)
    "https://region1.google-analytics.com", // Google Analytics Region 1
    "https://region2.google-analytics.com", // Google Analytics Region 2
    "https://*.vercel-analytics.com", // Vercel Analytics
    "https://vitals.vercel-insights.com", // Vercel Speed Insights
    "https://vercel.live", // Vercel Live Feedback (development/preview)
    "wss://*.pusher.com", // Pusher WebSocket connections (for Vercel Live Feedback/realtime features)
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
    `script-src-elem ${scriptSrc}`, // CSP Level 3: controls <script> elements specifically (fixes Vercel Live Feedback)
    `style-src ${styleSrc}`,
    `font-src ${fontSrc}`,
    `img-src ${imgSrc}`,
    `connect-src ${connectSrc}`,
    `frame-src 'self' https://vercel.live`, // Allow Vercel Live Feedback iframes
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
  // Disable next-intl's automatic locale detection – we handle it ourselves
  localeDetection: false,
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

