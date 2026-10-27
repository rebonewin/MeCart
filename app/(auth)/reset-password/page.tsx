"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/actions/auth";
import { guardRecoverySession } from "@/lib/actions/two-factor";

type LinkState = "checking" | "ready" | "blocked" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [blockedMessage, setBlockedMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          window.history.replaceState({}, "", "/reset-password");
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          window.history.replaceState({}, "", "/reset-password");
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (!cancelled) setLinkState("invalid");
          return;
        }

        // 2FA accounts must not gain a session from an email link: the guard
        // revokes it server-side and reports back a blocked state.
        const guard = await guardRecoverySession();
        if (cancelled) return;
        if (!guard.ok) {
          setBlockedMessage(guard.error);
          setLinkState("blocked");
          return;
        }

        setLinkState("ready");
      } catch {
        if (!cancelled) setLinkState("invalid");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await updatePassword({ newPassword: password });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lx-dark-scene relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--lx-bg)] px-4 py-16 text-[var(--lx-text)]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[var(--lx-champagne)]/12 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[var(--lx-champagne-warm)]/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-md">
        <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--lx-champagne)]/60 to-transparent" />
          {linkState === "checking" && (
            <p className="text-sm text-[var(--lx-muted)]">Verifying your reset link...</p>
          )}

          {linkState === "ready" && (
            <>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--lx-gold-soft)]">MeCart Security</p>
              <h1 className="mt-2 text-2xl font-bold">Choose a new password</h1>
              <p className="mt-1 text-sm text-[var(--lx-muted)]">
                Pick a password with at least 8 characters.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="lx-field h-12 w-full"
                  required
                  minLength={8}
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="lx-field h-12 w-full"
                  required
                  minLength={8}
                />
                {error && <p className="text-sm text-rose-200" role="alert">{error}</p>}
                <Button
                  disabled={loading}
                  type="submit"
                  loading={loading}
                  loadingText="Updating…"
                  variant="brand"
                  size="lg"
                  magnetic
                  className="w-full rounded-full"
                >
                  Update password
                </Button>
              </form>
            </>
          )}

          {linkState === "blocked" && (
            <>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--lx-gold-soft)]">MeCart Security</p>
              <h1 className="mt-2 text-2xl font-bold">Two-factor protection applied</h1>
              <p className="mt-1 text-sm text-[var(--lx-muted)]">{blockedMessage}</p>
              <p className="mt-4 text-sm">
                <Link
                  href="/login"
                  className="font-medium text-[var(--lx-gold-soft)] hover:underline"
                >
                  Go to sign in
                </Link>
              </p>
            </>
          )}

          {linkState === "invalid" && (
            <>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--lx-gold-soft)]">MeCart Security</p>
              <h1 className="mt-2 text-2xl font-bold">Link invalid or expired</h1>
              <p className="mt-1 text-sm text-[var(--lx-muted)]">
                Password reset links can only be used once, in the same browser they were requested
                from, and expire after a short time.
              </p>
              <p className="mt-4 text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[var(--lx-gold-soft)] hover:underline"
                >
                  Request a new reset link
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
