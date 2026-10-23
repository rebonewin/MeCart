"use client";

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase, hasSupabaseSessionCookie } from "@/lib/supabase/browser";
import type { AppRole } from "@/types/database";

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: AppRole;
  username: string | null;
  isAnonymous: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  const loadUser = useCallback(async () => {
    try {
      const supabase = await getSupabase();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        return;
      }

      const isAnonymous = Boolean(authUser.is_anonymous) || !authUser.email;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, username, full_name")
        .eq("id", authUser.id)
        .maybeSingle();

      setUser({
        id: authUser.id,
        email: authUser.email ?? null,
        name: profile?.full_name ?? (authUser.user_metadata?.name as string | undefined) ?? null,
        role: profile?.role ?? "customer",
        username: profile?.username ?? null,
        isAnonymous,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let timer = 0;

    if (!hasSupabaseSessionCookie()) {
      timer = window.setTimeout(() => {
        if (!cancelled) setLoading(false);
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    // Returning visitors already have a session; hydrate auth just after the
    // first paint so the storefront can become interactive sooner.
    timer = window.setTimeout(() => {
      void loadUser();
      void getSupabase()
        .then((supabase) => {
          if (cancelled) return;
          const { data } = supabase.auth.onAuthStateChange((event) => {
            if (
              event === "SIGNED_IN" ||
              event === "SIGNED_OUT" ||
              event === "USER_UPDATED" ||
              event === "INITIAL_SESSION"
            ) {
              void loadUser().then(() => router.refresh());
            }
          });
          unsubscribe = () => data.subscription.unsubscribe();
        })
        .catch(() => undefined);
    }, 900);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unsubscribe?.();
    };
  }, [loadUser, router]);

  // A client-side sign-in or sign-out changes the cookie without remounting
  // the provider. Reconcile the visible account on the next route change.
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    if (!hasSupabaseSessionCookie()) return;
    const timer = window.setTimeout(() => void loadUser(), 0);
    return () => window.clearTimeout(timer);
  }, [pathname, loadUser]);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const isStaff = user?.role === "admin" || user?.role === "manager";

  return (
    <AuthContext.Provider value={{ user, loading, isStaff, signOut, refresh: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
