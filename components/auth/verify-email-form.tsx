"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { MailCheck, ShieldCheck } from "lucide-react";

import { requestEmailVerificationOtp, verifyOtpCode } from "@/lib/actions/email-otp";

type Stage = "email" | "code";

function OtpBoxes({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const applyPaste = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    const next = [...value];
    for (let i = 0; i < 6; i += 1) next[i] = digits[i] ?? "";
    onChange(next);
    refs.current[Math.min(digits.length, 5)]?.focus();
  };

  return (
    <div role="group" aria-label="6 digit verification code" className="grid grid-cols-6 gap-2 sm:gap-3">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            if (digits.length > 1) {
              applyPaste(digits);
              return;
            }
            const next = [...value];
            next[index] = digits;
            onChange(next);
            if (digits && index < 5) refs.current[index + 1]?.focus();
          }}
          onPaste={(event) => {
            event.preventDefault();
            applyPaste(event.clipboardData.getData("text"));
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit && index > 0) {
              event.preventDefault();
              const next = [...value];
              next[index - 1] = "";
              onChange(next);
              refs.current[index - 1]?.focus();
            } else if (event.key === "ArrowLeft" && index > 0) {
              event.preventDefault();
              refs.current[index - 1]?.focus();
            } else if (event.key === "ArrowRight" && index < 5) {
              event.preventDefault();
              refs.current[index + 1]?.focus();
            }
          }}
          onFocus={(event) => event.target.select()}
          autoFocus={index === 0}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of 6`}
          className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/70 text-center text-xl font-bold text-white caret-blue-400 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50"
        />
      ))}
    </div>
  );
}

export function VerifyEmailForm({ presetEmail }: { presetEmail: string }) {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState(presetEmail);
  const [digits, setDigits] = useState<string[]>(Array.from({ length: 6 }, () => ""));
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const resendInSeconds = resendAvailableAt ? Math.max(0, Math.floor((resendAvailableAt - now) / 1000)) : 0;
  const code = digits.join("");

  const sendCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target) {
      setError("Enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await requestEmailVerificationOtp(target);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEmail(target);
      setDigits(Array.from({ length: 6 }, () => ""));
      setOtpError("");
      setExpiresAt(Date.now() + result.expiresInSeconds * 1000);
      setResendAvailableAt(Date.now() + result.resendAvailableInSeconds * 1000);
      setResendCount(result.resendCount);
      toast.success(result.message);
      setStage("code");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (code.length !== 6) {
      setOtpError("Enter all 6 code digits.");
      return;
    }
    setLoading(true);
    setOtpError("");
    try {
      const result = await verifyOtpCode("email_verification", { email, token: code });
      if (!result.ok) {
        setOtpError(result.error);
        return;
      }
      setDone(true);
      toast.success("Email verified — signing you in…");
      window.setTimeout(() => window.location.assign(result.redirectTo ?? "/"), 800);
    } finally {
      setLoading(false);
    }
  };

  const maxResendsReached = resendCount >= 5;
  const resendDisabled = resendInSeconds > 0 || maxResendsReached || loading;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <motion.div
          className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 18, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"
          animate={{ x: [0, -36, 0], y: [0, -22, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl"
      >
        <div className="relative">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-blue-500/15">
              {done ? (
                <ShieldCheck className="h-7 w-7 text-emerald-300" />
              ) : (
                <MailCheck className="h-7 w-7 text-blue-300" />
              )}
            </div>
            <p className="text-xs uppercase tracking-[0.35em] text-blue-300">MeCart Security</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Verify your email</h1>
            <p className="mt-3 text-sm text-slate-300" aria-live="polite">
              {stage === "email" && "Confirm your address to unlock your account."}
              {stage === "code" && `Enter the 6-digit code we sent to ${email}.`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {stage === "email" && (
              <motion.form
                key="email"
                onSubmit={sendCode}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                    required
                  />
                </label>

                {error && (
                  <p role="alert" className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.015, y: loading ? 0 : -1 }}
                  whileTap={{ scale: 0.985 }}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-bold text-white shadow-xl shadow-blue-600/25 transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Sending code…" : "Send verification code"}
                </motion.button>
              </motion.form>
            )}

            {stage === "code" && (
              <motion.form
                key="code"
                onSubmit={verify}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <OtpBoxes value={digits} onChange={setDigits} disabled={loading || done} />

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm">
                  <span className="text-slate-300" aria-live="polite">
                    {secondsRemaining > 0
                      ? `Code expires in ${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`
                      : "Your code has expired."}
                  </span>
                  <button
                    type="button"
                    onClick={() => sendCode()}
                    disabled={resendDisabled}
                    className="font-semibold text-blue-300 transition hover:text-blue-200 disabled:text-slate-500"
                  >
                    {maxResendsReached
                      ? "Maximum resends reached"
                      : resendInSeconds > 0
                        ? `Resend in ${resendInSeconds}s`
                        : "Resend code"}
                  </button>
                </div>

                {otpError && (
                  <p role="alert" className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {otpError}
                  </p>
                )}

                {done && (
                  <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    Email verified. Taking you to your account…
                  </p>
                )}

                <div className="flex gap-3">
                  <motion.button
                    type="submit"
                    disabled={loading || code.length !== 6 || done}
                    whileHover={{ scale: loading ? 1 : 1.015, y: loading ? 0 : -1 }}
                    whileTap={{ scale: 0.985 }}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-bold text-white shadow-xl shadow-blue-600/25 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Verifying…" : "Verify email"}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setStage("email")}
                    disabled={loading}
                    className="h-12 rounded-2xl border border-white/10 px-4 text-sm font-medium text-slate-200 transition hover:border-white/25"
                  >
                    Change email
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-sm text-slate-400">
            <Link href="/login" className="transition hover:text-white">
              Back to sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
