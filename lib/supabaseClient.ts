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
      get(name: string) {
        return req?.cookies?.[name] ?? undefined;
      },
      set(name: string, value: string, options: CookieOptions) {
        if (res) res?.cookie?.(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        if (res) res?.clearCookie?.(name, options);
      },
    },
  });
}
