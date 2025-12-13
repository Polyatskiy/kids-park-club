"use client";

import { useEffect, useState, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useTranslations, useLocale } from "next-intl";

/* ============================================================
   NAVIGATION HOOK - Shared between Navbar and Mobile Menu
   
   Provides:
   - Navigation links (with admin link for authorized users)
   - User state (logged in/out)
   - Loading state
   - Logout handler
============================================================ */

// Admin email - single source of truth
export const ADMIN_EMAIL = "polyatskiy@gmail.com";

// Navigation link type
export type NavLink = {
  href: string;
  label: string;
};

// Return type for the hook
export interface NavigationState {
  user: any;
  loading: boolean;
  links: NavLink[];
  handleLogout: () => Promise<void>;
  isAdmin: boolean;
}

export function useNavigation(): NavigationState {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("common");
  const locale = useLocale(); // Get current locale to trigger re-render when it changes

  useEffect(() => {
    const supabase = supabaseBrowser();

    // Load user on first render
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // React to login/logout immediately
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Check if user is admin
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Build links array with translations (add admin if user is admin)
  // Use useMemo to rebuild links when locale or isAdmin changes
  // Note: t() calls are reactive to locale changes automatically via next-intl
  const links: NavLink[] = useMemo(() => {
    const navLinks: NavLink[] = [
      { href: "/", label: t("home") },
      { href: "/coloring", label: t("coloring") },
      { href: "/games", label: t("games") },
    ];
    if (isAdmin) {
      navLinks.push({ href: "/admin", label: t("admin") });
    }
    return navLinks;
  }, [locale, isAdmin]); // Rebuild when locale or admin status changes

  return {
    user,
    loading,
    links,
    handleLogout,
    isAdmin,
  };
}
