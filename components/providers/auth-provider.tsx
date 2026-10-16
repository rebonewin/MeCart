"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

  const loadUser = useCallback(async () => {
    try {
      const supabase = createClient();
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
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      supabase = null;
    }

    const timer = window.setTimeout(() => void loadUser(), 0);

    const subscription = supabase
      ? supabase.auth.onAuthStateChange((event) => {
          if (
            event === "SIGNED_IN" ||
            event === "SIGNED_OUT" ||
            event === "USER_UPDATED" ||
            event === "INITIAL_SESSION"
          ) {
            void loadUser().then(() => router.refresh());
          }
        }).data.subscription
      : null;

    return () => {
      window.clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, [loadUser, router]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
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
