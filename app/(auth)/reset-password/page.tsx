"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/actions/auth";

type LinkState = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<LinkState>("checking");
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
        if (!cancelled) setLinkState(data.session ? "ready" : "invalid");
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-4 py-16 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="relative mx-auto max-w-md">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          {linkState === "checking" && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Verifying your reset link...</p>
          )}

          {linkState === "ready" && (
            <>
              <h1 className="text-2xl font-bold">Choose a new password</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Pick a password with at least 8 characters.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded border px-3 py-2 dark:bg-gray-800"
                  required
                  minLength={8}
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded border px-3 py-2 dark:bg-gray-800"
                  required
                  minLength={8}
                />
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          )}

          {linkState === "invalid" && (
            <>
              <h1 className="text-2xl font-bold">Link invalid or expired</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Password reset links can only be used once, in the same browser they were requested
                from, and expire after a short time.
              </p>
              <p className="mt-4 text-sm">
                <Link
                  href="/forgot-password"
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
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
