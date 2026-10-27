"use client";

import { Button, IconButton } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { login } from "@/lib/actions/auth";
import { requestEmailVerificationOtp, verifyOtpCode } from "@/lib/actions/email-otp";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthMonogram } from "@/components/luxe/monogram";
import { VaultStage } from "@/components/luxe/webgl/vault-stage";
import { usePrefersReducedMotion } from "@/lib/motion";

const PRIVILEGES = [
  "Live order desk — every parcel's journey",
  "Wishlist carried across every device",
  "Private previews from the maisons",
] as const;

/**
 * The authentication vestibule. Presentation only — the flow itself
 * (server actions, OTP, OAuth) is untouched: keeping every Better Auth
 * handoff byte-for-byte is the whole point of this file.
 */
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
  const reduced = usePrefersReducedMotion();

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
    if ("requiresTwoFactor" in res && res.requiresTwoFactor) {
      toast.info("Password verified. Confirm your second factor to finish signing in.");
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
    <div className="lx-dark-scene relative flex min-h-screen flex-col overflow-hidden bg-[var(--lx-bg)] px-4 py-8 text-[var(--lx-text)] sm:py-10">
      <VaultStage variant="auth" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_88%_at_50%_-12%,transparent_38%,rgba(11,11,15,0.74)_100%)]"
      />

      <main
        id="main"
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center gap-16"
      >
        {/* brand vestibule — the Maison speaks before the form does */}
        <aside className="hidden w-full max-w-sm lg:block">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <AuthMonogram size="lg" />
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.34em] text-[var(--lx-gold)]">
              Maison · Est. 2026
            </p>
            <h2 className="lx-title mt-4 text-3xl text-[var(--lx-text)]">
              The atelier
              <br />
              <span className="lx-editorial text-[var(--lx-gold)]">remembers you.</span>
            </h2>
            <p className="lx-prose mt-5 max-w-xs text-sm text-[var(--lx-muted)]">
              Sign in and the room resumes: your parcels in motion, the shelf
              you left a piece on, the small notes our client care wrote you.
            </p>
            <ul className="mt-9 space-y-3.5">
              {PRIVILEGES.map((line) => (
                <li key={line} className="flex items-start gap-3 text-[13px] text-white/70">
                  <span
                    aria-hidden
                    className="mt-[7px] h-1 w-4 shrink-0 rounded-full bg-gradient-to-r from-[var(--lx-gold)] to-[var(--lx-champagne-warm)]"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </motion.div>
        </aside>

        {/* the glass card */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="lx-glass relative w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white/[0.055] p-7 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-9"
        >
          <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--lx-champagne)]/60 to-transparent" />
          <div className="relative">
            {/* compact identity for small screens */}
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <AuthMonogram size="sm" />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--lx-gold)]">
                MeCart Access
              </p>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-[var(--lx-gold)]">
                Welcome back
              </span>
              <span className="lx-title mt-3 block">Sign in</span>
            </h1>

            <p className="mt-2 text-sm leading-6 text-[var(--lx-muted)]">
              Enter the atelier to follow orders, saved pieces and private releases.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--lx-muted)]">
                  <Mail className="h-3.5 w-3.5" aria-hidden /> Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="lx-field h-12 w-full bg-white/[0.045]"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--lx-muted)]">
                  <Lock className="h-3.5 w-3.5" aria-hidden /> Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="lx-field h-12 w-full bg-white/[0.045] pr-12"
                    autoComplete="current-password"
                    required
                    minLength={8}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    <IconButton
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      variant="ghost"
                      size="icon-sm"
                      label={showPassword ? "Hide password" : "Show password"}
                      className="text-[var(--lx-muted)] hover:text-[var(--lx-text)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                    </IconButton>
                  </span>
                </div>
              </label>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="lx-error rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                    role="alert"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                loadingText="Signing in…"
                variant="brand"
                size="lg"
                magnetic
                className="w-full rounded-full"
              >
                Continue
              </Button>
            </form>

            {needsVerification && (
              <form onSubmit={verifyEmail} className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-[var(--lx-muted)]">Enter the 6-digit code sent to {email}.</p>
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
                      aria-label={`Code digit ${index + 1}`}
                      className="h-11 rounded-lg border border-white/10 bg-white/[0.04] text-center text-[var(--lx-text)] outline-none transition focus:border-[var(--lx-gold)] focus:bg-white/[0.07]"
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="text-sm text-rose-200" role="alert">
                    {otpError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    loading={verifyLoading}
                    loadingText="Verifying…"
                    variant="brand"
                    size="sm"
                    className="flex-1"
                  >
                    Verify email
                  </Button>
                  <Button
                    type="button"
                    onClick={resendVerification}
                    disabled={verifyLoading}
                    variant="outline"
                    size="sm"
                  >
                    Resend OTP
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link href="/register" className="rounded-full border border-white/10 px-3 py-2 text-center text-xs text-[var(--lx-muted)] transition hover:border-[var(--lx-gold)]/35 hover:text-[var(--lx-text)]">
                Email OTP
              </Link>
              <Link href="/phone-login" className="rounded-full border border-white/10 px-3 py-2 text-center text-xs text-[var(--lx-muted)] transition hover:border-[var(--lx-gold)]/35 hover:text-[var(--lx-text)]">
                Mobile OTP
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { createClient } = await import("@/lib/supabase/client");
                  const supabase = createClient();
                  await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/` } });
                }}
                className="w-full text-xs"
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { createClient } = await import("@/lib/supabase/client");
                  const supabase = createClient();
                  await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/auth/callback?next=/` } });
                }}
                className="w-full text-xs"
              >
                GitHub
              </Button>
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-white/[0.08] pt-5 text-xs text-[var(--lx-muted)]">
              <Link href="/register" className="transition hover:text-[var(--lx-text)]">
                Create account
              </Link>
              <Link href="/" className="transition hover:text-[var(--lx-text)]">
                Back to store
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 py-6 font-mono text-[9px] uppercase tracking-[0.26em] text-white/48">
        <span>Maison MeCart — authentication chamber</span>
        <span className="hidden sm:inline">Protected · Never shared</span>
      </footer>
    </div>
  );
}
