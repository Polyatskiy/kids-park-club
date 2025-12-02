import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_EMAIL = "polyatskiy@gmail.com";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next();

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

  const url = req.nextUrl.clone();

  // Защита маршрута /admin/*
  if (url.pathname.startsWith("/admin")) {
    // 1) Нет сессии → логин
    if (!session) {
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    // 2) Не администратор → домой
    if (session.user.email !== ADMIN_EMAIL) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

// На какие пути действует
export const config = {
  matcher: ["/admin/:path*"],
};
