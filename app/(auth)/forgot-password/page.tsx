"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const msg = await requestPasswordReset({ email });
      setMessage(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email");
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
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter your account email and we&apos;ll send you a reset link.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded border px-3 py-2 dark:bg-gray-800"
              required
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <Link href="/login" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
