"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import {
  requestEmailTwoFactorCode,
  requestSmsTwoFactorCode,
  verifyTwoFactorLogin,
} from "@/lib/actions/two-factor";
import type {
  TwoFactorChallengeView,
  TwoFactorVerificationMethod,
} from "@/lib/services/two-factor-service";

const EMPTY_DIGITS = () => Array.from({ length: 6 }, () => "");

function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

const METHOD_LABELS: Record<TwoFactorVerificationMethod, string> = {
  totp: "Authenticator",
  email: "Email",
  sms: "SMS",
  recovery: "Recovery code",
};

const METHOD_ICONS: Record<TwoFactorVerificationMethod, React.ReactNode> = {
  totp: <KeyRound className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  sms: <Smartphone className="h-4 w-4" />,
  recovery: <ShieldCheck className="h-4 w-4" />,
};

export function TwoFactorChallenge({ view }: { view: TwoFactorChallengeView }) {
  const availableMethods = useMemo(
    () =>
      (["totp", "email", "sms", "recovery"] as TwoFactorVerificationMethod[]).filter(
        (method) => view.methods[method],
      ),
    [view.methods],
  );

  const [method, setMethod] = useState<TwoFactorVerificationMethod | null>(
    view.defaultMethod ?? availableMethods[0] ?? null,
  );
  const [digits, setDigits] = useState<string[]>(EMPTY_DIGITS);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [remainingSends, setRemainingSends] = useState(
    method === "email"
      ? Math.max(0, 3 - view.emailSendCount)
      : method === "sms"
        ? Math.max(0, 3 - view.smsSendCount)
        : 3,
  );
  const [sent, setSent] = useState(Boolean(method === "email" ? view.emailSentAt : method === "sms" ? view.smsSentAt : null));
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [lockDeadline, setLockDeadline] = useState<string | null>(view.lockedUntil ?? null);
  const [lockLeft, setLockLeft] = useState(() =>
    view.lockedUntil
      ? Math.max(0, Math.floor((new Date(view.lockedUntil).getTime() - Date.now()) / 1000))
      : 0,
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const submittingRef = useRef(false);

  useEffect(() => {
    const expiry = new Date(view.expiresAt).getTime();
    const update = () => setSecondsLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [view.expiresAt]);

  useEffect(() => {
    if (!lockDeadline) return;
    const locked = new Date(lockDeadline).getTime();
    const update = () => setLockLeft(Math.max(0, Math.floor((locked - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [lockDeadline]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const locked = lockLeft > 0;
  const expired = secondsLeft <= 0;

  const submit = useCallback(
    async (overrideMethod?: TwoFactorVerificationMethod, overrideCode?: string) => {
      const activeMethod = overrideMethod ?? method;
      if (!activeMethod || submittingRef.current || locked || completed) return;

      const code = overrideCode ?? (activeMethod === "recovery" ? recoveryCode : digits.join(""));
      if (!code.trim()) {
        setError("Enter your verification code.");
        return;
      }

      submittingRef.current = true;
      setVerifying(true);
      setError("");

      try {
        const result = await verifyTwoFactorLogin({
          method: activeMethod,
          code,
          rememberDevice,
        });

        if (result.ok) {
          setCompleted(true);
          toast.success("Identity confirmed. Signing you in…");
          // Full document load so every provider (auth, cart, wishlist)
          // initialises from the freshly established session.
          window.location.assign(new URL(result.redirectTo, window.location.origin).toString());
          return;
        }

        setError(result.error);
        setDigits(EMPTY_DIGITS());
        setRecoveryCode("");
        inputRefs.current[0]?.focus();

        if (result.locked) {
          setLockDeadline(
            result.lockedUntil ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          );
          toast.error("Second-factor verification is temporarily locked.");
        }
        if (result.expired) {
          toast.error("Your verification session expired. Please sign in again.");
          window.setTimeout(
            () => window.location.replace(new URL("/login", window.location.origin).toString()),
            1400,
          );
        }
      } catch {
        setError("We couldn't verify that code right now. Please try again.");
      } finally {
        submittingRef.current = false;
        setVerifying(false);
      }
    },
    [completed, digits, locked, method, recoveryCode, rememberDevice],
  );

  const requestCode = async () => {
    if (!method || method === "totp" || method === "recovery") return;
    setSending(true);
    setError("");

    try {
      const result =
        method === "email" ? await requestEmailTwoFactorCode() : await requestSmsTwoFactorCode();

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSent(true);
      setCooldown(result.cooldownSeconds);
      setRemainingSends(result.remainingSends);
      toast.success(result.message);
      window.setTimeout(() => inputRefs.current[0]?.focus(), 120);
    } catch {
      setError("We couldn't send that code right now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const switchMethod = (next: TwoFactorVerificationMethod) => {
    setMethod(next);
    setError("");
    setDigits(EMPTY_DIGITS());
    setRecoveryCode("");
    setRemainingSends(
      next === "email"
        ? Math.max(0, 3 - view.emailSendCount)
        : next === "sms"
          ? Math.max(0, 3 - view.smsSendCount)
          : 3,
    );
    setSent(Boolean(next === "email" ? view.emailSentAt : next === "sms" ? view.smsSentAt : null));
  };

  const handleDigit = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && method && method !== "recovery" && next.every((digit) => digit.length === 1)) {
      void submit(undefined, next.join(""));
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const next = EMPTY_DIGITS();
    pasted.split("").forEach((char, index) => {
      next[index] = char;
    });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (method && method !== "recovery" && pasted.length === 6 && next.every((digit) => digit.length === 1)) {
      void submit(undefined, pasted);
    }
  };

  const requiresSend = (method === "email" || method === "sms") && !sent;

  if (availableMethods.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] px-4 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center backdrop-blur-2xl">
          <ShieldCheck className="mx-auto h-10 w-10 text-amber-300" />
          <h1 className="mt-4 text-2xl font-bold">No verification methods available</h1>
          <p className="mt-3 text-sm text-slate-300">
            Your account has two-factor authentication enabled, but no usable method is available
            right now. Contact support to regain access.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl"
          animate={{ x: [0, 36, 0], y: [0, 22, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 bottom-12 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"
          animate={{ x: [0, -34, 0], y: [0, -20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">MeCart Security</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Confirm it&apos;s you</h1>
            <p className="mt-3 text-sm text-slate-300">
              Password verified. Complete the second step to finish signing in.
            </p>
          </div>

          {availableMethods.length > 1 && (
            <div className="mt-6 grid grid-cols-2 gap-2" role="tablist" aria-label="Verification methods">
              {availableMethods.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={method === option}
                  onClick={() => switchMethod(option)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-semibold transition ${
                    method === option
                      ? "border-indigo-400/60 bg-indigo-500/20 text-white"
                      : "border-white/10 bg-slate-950/40 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {METHOD_ICONS[option]}
                  {METHOD_LABELS[option]}
                </button>
              ))}
            </div>
          )}

          {locked && (
            <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200" role="alert" suppressHydrationWarning>
              <p className="flex items-center gap-2 font-semibold">
                <Lock className="h-4 w-4" /> Temporarily locked
              </p>
              <p className="mt-1 text-amber-100/80">
                Too many failed attempts. Try again in {formatClock(lockLeft)}.
              </p>
            </div>
          )}

          {!locked && expired && (
            <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">
              This verification session expired. Please sign in again.
            </div>
          )}

          <div className="mt-6 space-y-4">
            {method === "totp" && (
              <div>
                <p className="text-sm text-slate-300">
                  Enter the 6-digit code from your authenticator app.
                </p>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      value={digit}
                      onChange={(event) => handleDigit(index, event.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={(event) => {
                        if (event.key === "Backspace" && !digits[index] && index > 0) {
                          inputRefs.current[index - 1]?.focus();
                        }
                      }}
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      aria-label={`Authenticator code digit ${index + 1}`}
                      maxLength={1}
                      autoFocus={index === 0}
                      disabled={locked || expired}
                      className="h-12 rounded-xl border border-white/10 bg-slate-950/60 text-center text-lg font-semibold text-white outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-60"
                    />
                  ))}
                </div>
              </div>
            )}

            {(method === "email" || method === "sms") && (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">
                  {method === "email"
                    ? `We'll email a 6-digit code to ${view.maskedEmail ?? "your verified email"}.`
                    : `We'll text a 6-digit code to ${view.maskedPhone ?? "your verified phone"}.`}
                </p>

                {requiresSend ? (
                  <button
                    type="button"
                    onClick={requestCode}
                    disabled={sending || locked || expired}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {method === "email" ? "Send email code" : "Send SMS code"}
                  </button>
                ) : (
                  <>
                    <div className="grid grid-cols-6 gap-2">
                      {digits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(element) => {
                            inputRefs.current[index] = element;
                          }}
                          value={digit}
                          onChange={(event) => handleDigit(index, event.target.value)}
                          onPaste={handlePaste}
                          onKeyDown={(event) => {
                            if (event.key === "Backspace" && !digits[index] && index > 0) {
                              inputRefs.current[index - 1]?.focus();
                            }
                          }}
                          inputMode="numeric"
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          aria-label={`${METHOD_LABELS[method]} code digit ${index + 1}`}
                          maxLength={1}
                          autoFocus={index === 0}
                          disabled={locked || expired}
                          className="h-12 rounded-xl border border-white/10 bg-slate-950/60 text-center text-lg font-semibold text-white outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-60"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={requestCode}
                      disabled={sending || cooldown > 0 || remainingSends <= 0 || locked || expired}
                      className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending
                        ? "Sending…"
                        : cooldown > 0
                          ? `Resend in ${formatClock(cooldown)}`
                          : remainingSends > 0
                            ? `Resend code (${remainingSends} left)`
                            : "No resends left"}
                    </button>
                  </>
                )}
              </div>
            )}

            {method === "recovery" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">
                  Enter one of your one-time recovery codes (XXXXX-XXXXX).
                </p>
                <input
                  value={recoveryCode}
                  onChange={(event) => setRecoveryCode(event.target.value.toUpperCase())}
                  placeholder="XXXXX-XXXXX"
                  aria-label="Recovery code"
                  autoFocus
                  disabled={locked || expired}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-center font-mono text-lg tracking-[0.2em] text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => void submit("recovery")}
                  disabled={verifying || locked || expired}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Verify recovery code
                </button>
              </div>
            )}

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
                className="h-4 w-4 accent-indigo-500"
              />
              Trust this device for 30 days
            </label>

            <AnimatePresence>
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {completed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
              >
                <CheckCircle2 className="h-4 w-4" /> Verified — signing you in…
              </motion.p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
            <span>Session expires in {formatClock(secondsLeft)}</span>
            <Link href="/login" className="inline-flex items-center gap-1 transition hover:text-white">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
