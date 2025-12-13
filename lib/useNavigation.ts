"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

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

// Base navigation links
const BASE_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/coloring", label: "Coloring" },
  { href: "/games", label: "Games" },
];

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

  // Build links array (add admin if user is admin)
  const links: NavLink[] = [...BASE_LINKS];
  if (isAdmin) {
    links.push({ href: "/admin", label: "Admin" });
  }

  return {
    user,
    loading,
    links,
    handleLogout,
    isAdmin,
  };
}
