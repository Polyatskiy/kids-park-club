import createMiddleware from 'next-intl/middleware';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from './src/i18n/routing';

const ADMIN_EMAIL = "polyatskiy@gmail.com";

// Create the i18n middleware
const handleI18nRouting = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
  // Debug: Confirm proxy executes
  console.log('Proxy hit!', req.nextUrl.pathname);
  
  // First, handle i18n routing - this handles locale detection, rewriting, and redirects
  // The middleware always returns a response
  const i18nResponse = handleI18nRouting(req);
  
  // Debug: Confirm proxy executes
  if (i18nResponse) {
    i18nResponse.headers.set('x-proxy-hit', '1');
    console.log('i18nResponse status:', i18nResponse.status);
    console.log('x-middleware-rewrite:', i18nResponse.headers.get('x-middleware-rewrite'));
  }
  
  // If i18n middleware returns a redirect (for locale switching), return it immediately
  // This happens when locale needs to be added/removed from URL
  if (i18nResponse && (i18nResponse.status === 307 || i18nResponse.status === 308)) {
    return i18nResponse;
  }

  // The middleware always returns a response (either a rewrite or next())
  // Use it as the base for Supabase integration
  let response = i18nResponse;
  
  // Check if we need explicit rewrite for locale routes
  const needsExplicitRewrite = response && !response.headers.get('x-middleware-rewrite');
  let localeForRewrite: string | null = null;
  
  if (needsExplicitRewrite) {
    const pathname = req.nextUrl.pathname;
    const pathSegments = pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    
    // Check if first segment is a valid locale
    if (firstSegment && routing.locales.includes(firstSegment as any)) {
      localeForRewrite = firstSegment;
    }
  }

  // Create Supabase client using the response from i18n middleware
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

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If we need explicit rewrite, do it now (after Supabase client is created)
  // For localePrefix: 'as-needed', next-intl doesn't rewrite non-default locales
  // We need to explicitly rewrite /uk to match [locale] segment
  if (localeForRewrite && !response.headers.get('x-middleware-rewrite')) {
    const pathname = req.nextUrl.pathname;
    
    // For localePrefix: 'as-needed', when a non-default locale is in the URL (e.g., /uk),
    // we need to rewrite it so Next.js matches it to the [locale] dynamic segment.
    // The path /uk should match src/app/[locale]/page.tsx where locale=uk
    // We'll rewrite to the same path but ensure Next.js understands it's a locale segment
    const rewriteUrl = new URL(pathname, req.url);
    
    // Create a new response with rewrite
    const rewrittenResponse = NextResponse.rewrite(rewriteUrl);
    
    // Copy all headers from the original response
    response.headers.forEach((value, key) => {
      rewrittenResponse.headers.set(key, value);
    });
    
    // Ensure locale header is set for next-intl - this is critical
    rewrittenResponse.headers.set('x-next-intl-locale', localeForRewrite);
    rewrittenResponse.headers.set('x-proxy-hit', '1');
    
    // Copy cookies from original response (if cookies exist)
    if (response.cookies) {
      response.cookies.getAll().forEach((cookie) => {
        rewrittenResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
    }
    
    // Also copy cookies from the request (for Supabase session)
    req.cookies.getAll().forEach((cookie) => {
      rewrittenResponse.cookies.set(cookie.name, cookie.value);
    });
    
    // Update response to use the rewritten one
    response = rewrittenResponse;
    
    console.log('Explicit rewrite to:', rewriteUrl.pathname, 'locale:', localeForRewrite);
    console.log('x-next-intl-locale header:', response.headers.get('x-next-intl-locale'));
    console.log('x-middleware-rewrite after rewrite:', response.headers.get('x-middleware-rewrite'));
    console.log('Response status:', response.status);
  }

  // Get the pathname - check the rewritten URL if available
  // The middleware may have rewritten / to /en internally
  let pathname = req.nextUrl.pathname;
  
  // Check if there's a rewrite header (middleware rewrites)
  const rewriteHeader = response.headers.get('x-middleware-rewrite');
  if (rewriteHeader) {
    try {
      const rewriteUrl = new URL(rewriteHeader, req.url);
      pathname = rewriteUrl.pathname;
    } catch {
      // Fallback to original pathname
    }
  }

  // Protect /admin/* routes (considering locale prefix)
  // Admin routes can be: /admin, /en/admin, /pl/admin, /uk/admin, /ru/admin
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  const isLocaleSegment = firstSegment && routing.locales.includes(firstSegment as any);
  const adminSegment = isLocaleSegment ? pathSegments[1] : pathSegments[0];
  const isAdminRoute = adminSegment === 'admin';

  if (isAdminRoute) {
    // 1) No session → redirect to login
    if (!session) {
      const locale = isLocaleSegment ? firstSegment : 'en';
      const loginPath = locale === 'en' 
        ? '/auth/login' 
        : `/${locale}/auth/login`;
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = loginPath;
      return NextResponse.redirect(redirectUrl);
    }

    // 2) Not admin → redirect home
    if (session.user.email !== ADMIN_EMAIL) {
      const locale = isLocaleSegment ? firstSegment : 'en';
      const homePath = locale === 'en' 
        ? '/' 
        : `/${locale}`;
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = homePath;
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

// Matcher excludes /api, /trpc, /_next, /_vercel and static files (dots)
export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
