import createMiddleware from 'next-intl/middleware';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from './src/i18n/routing';

const ADMIN_EMAIL = "polyatskiy@gmail.com";

// Create the i18n middleware
const handleI18nRouting = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
  // First, handle i18n routing - this handles locale detection, rewriting, and redirects
  // The middleware always returns a response
  const i18nResponse = handleI18nRouting(req);
  
  // Debug: Confirm proxy executes
  if (i18nResponse) {
    i18nResponse.headers.set('x-proxy-hit', '1');
  }
  
  // If i18n middleware returns a redirect (for locale switching), return it immediately
  // This happens when locale needs to be added/removed from URL
  if (i18nResponse && (i18nResponse.status === 307 || i18nResponse.status === 308)) {
    return i18nResponse;
  }

  // The middleware always returns a response (either a rewrite or next())
  // Use it as the base for Supabase integration
  const response = i18nResponse;

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
