import { createBrowserClient } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* ----------------------------------------
   1) БРАУЗЕР — всегда работает
---------------------------------------- */
export function supabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseAnon);
}

/* ----------------------------------------
   2) СЕРВЕР — БЕЗ cookies() !!!
      безопасно для pages/ и app/
---------------------------------------- */
export function supabaseServer(req?: any, res?: any) {
  return createServerClient(supabaseUrl, supabaseService, {
      cookies: {
        getAll() {
          if (!req?.cookies) return [];
          return Object.entries(req.cookies).map(([name, value]) => ({
            name,
            value: typeof value === "string" ? value : String(value || ""),
          }));
        },
      setAll(cookiesToSet) {
        if (!res) return;
        cookiesToSet.forEach(({ name, value, options }) => {
          if (value === undefined || value === null) {
            res?.clearCookie?.(name, options);
          } else {
            res?.cookie?.(name, value, options);
          }
        });
      },
    },
  });
}
