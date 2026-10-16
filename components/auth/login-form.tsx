"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { login } from "@/lib/actions/auth";
import { requestEmailVerificationOtp, verifyOtpCode } from "@/lib/actions/email-otp";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export function LoginForm({ presetEmail }: { presetEmail: string }) {
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: 6 }, () => ""));
  const [otpError, setOtpError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const callbackUrl =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("callbackUrl")
        : null;

    const res = await login({ username: email, password, callbackUrl });
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      if (res.needsVerification) {
        const target = (res.email ?? email).trim().toLowerCase();
        setEmail(target);
        setNeedsVerification(true);
        requestEmailVerificationOtp(target)
          .then((result) => {
            if (result.ok) toast.info(`We sent a fresh 6-digit code to ${target}.`);
            else setError(result.error);
          })
          .catch(() => null);
      }
      return;
    }
    // Hard navigation so every provider (auth/cart/wishlist) initialises with
    // the new session right away.
    window.location.assign(res.redirectTo);
  };

  const verifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpDigits.join("");
    if (token.length !== 6) {
      setOtpError("Enter all 6 code digits.");
      return;
    }
    setVerifyLoading(true);
    setOtpError("");
    try {
      const result = await verifyOtpCode("email_verification", { email, token });
      if (!result.ok) {
        setOtpError(result.error);
        return;
      }
      // verifyOtp() already established the session — continue straight in.
      toast.success("Email verified — signing you in…");
      setNeedsVerification(false);
      window.setTimeout(() => window.location.assign(result.redirectTo ?? "/"), 700);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const resendVerification = async () => {
    setVerifyLoading(true);
    try {
      const result = await requestEmailVerificationOtp(email);
      if (!result.ok) setError(result.error);
      else setError("");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, -25, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-blue-300">MeCart Access</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Sign in</h1>
            <p className="mt-3 text-sm text-slate-300">
              Enter your account to continue shopping, managing orders, and exploring premium products.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Mail className="h-4 w-4" /> Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Lock className="h-4 w-4" /> Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.015, y: loading ? 0 : -1 }}
              whileTap={{ scale: 0.985 }}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-bold text-white shadow-xl shadow-blue-600/25 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Continue"}
            </motion.button>
          </form>

          {needsVerification && (
            <form onSubmit={verifyEmail} className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <p className="text-sm text-slate-200">Enter the 6-digit code sent to {email}.</p>
              <div className="grid grid-cols-6 gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    value={digit}
                    onChange={(e) => {
                      const next = [...otpDigits];
                      next[index] = e.target.value.replace(/\D/g, "").slice(0, 1);
                      setOtpDigits(next);
                      if (next[index] && index < 5) (document.querySelectorAll<HTMLInputElement>('input[data-otp]')[index + 1])?.focus();
                    }}
                    maxLength={1}
                    inputMode="numeric"
                    data-otp="true"
                    className="h-10 rounded-lg border border-white/10 bg-slate-950/60 text-center text-white"
                  />
                ))}
              </div>
              {otpError && <p className="text-sm text-red-200">{otpError}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={verifyLoading} className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
                  {verifyLoading ? "Verifying..." : "Verify email"}
                </button>
                <button type="button" onClick={resendVerification} disabled={verifyLoading} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200">
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link href="/register" className="rounded-xl border border-white/10 px-3 py-2 text-center text-xs text-slate-300 transition hover:bg-white/10">
              Email OTP
            </Link>
            <Link href="/phone-login" className="rounded-xl border border-white/10 px-3 py-2 text-center text-xs text-slate-300 transition hover:bg-white/10">
              Mobile OTP
            </Link>
            <button
              type="button"
              onClick={async () => {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/` } });
              }}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
            >
              Google
            </button>
            <button
              type="button"
              onClick={async () => {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/` } });
              }}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
            >
              GitHub
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
            <Link href="/register" className="transition hover:text-white">
              Create account
            </Link>
            <Link href="/" className="transition hover:text-white">
              Back to store
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
