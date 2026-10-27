"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  completePasswordReset,
} from "@/lib/actions/email-otp";
import { passwordStrength } from "@/lib/auth/password-strength";
import { LiquidStage } from "@/components/luxe/webgl/liquid-stage";

type Step = "email" | "verify" | "password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: 6 }, () => ""));
  const [otpError, setOtpError] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const secondsRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const resendInSeconds = resendAvailableAt ? Math.max(0, Math.floor((resendAvailableAt - now) / 1000)) : 0;
  const otpValue = otpDigits.join("");

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await requestPasswordResetOtp(email.trim());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setExpiresAt(Date.now() + result.expiresInSeconds * 1000);
      setResendAvailableAt(Date.now() + result.resendAvailableInSeconds * 1000);
      setResendCount(result.resendCount);
      setOtpDigits(Array.from({ length: 6 }, () => ""));
      setOtpError("");
      toast.success(result.message);
      setStep("verify");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCount >= 5) {
      toast.error("Maximum resend attempts reached. Please wait.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestPasswordResetOtp(email.trim());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setExpiresAt(Date.now() + result.expiresInSeconds * 1000);
      setResendAvailableAt(Date.now() + result.resendAvailableInSeconds * 1000);
      setResendCount(result.resendCount || resendCount + 1);
      setOtpDigits(Array.from({ length: 6 }, () => ""));
      setOtpError("");
      toast.success(result.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setOtpError("Enter all 6 code digits.");
      return;
    }
    setLoading(true);
    setOtpError("");
    try {
      const result = await verifyPasswordResetOtp({ email: email.trim(), token: otpValue });
      if (!result.ok) {
        setOtpError(result.error);
        return;
      }
      toast.success("Code verified. Choose your new password.");
      setStep("password");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setLoading(true);
    try {
      const result = await completePasswordReset({ email: email.trim(), password, confirm });
      if (!result.ok) {
        setPasswordError(result.error);
        return;
      }
      toast.success(result.message);
      setStep("success");
      window.setTimeout(() => router.push("/login"), 900);
    } finally {
      setLoading(false);
    }
  };

  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const setDigit = (index: number, next: string) => {
    const chars = next.replace(/\D/g, "").slice(0, 1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = chars;
    setOtpDigits(nextDigits);
    if (chars && index < 5) refs.current[index + 1]?.focus();
  };
  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted.length) return;
    event.preventDefault();
    const next = [...otpDigits];
    for (let i = 0; i < 6; i += 1) next[i] = pasted[i] ?? "";
    setOtpDigits(next);
    refs.current[5]?.focus();
  };

  return (
    <div className="dark lx-dark-scene relative min-h-screen overflow-hidden bg-[var(--lx-bg)] px-4 py-16 text-[var(--lx-text)]">
      <LiquidStage variant="hero" intensity={0.7} />
      <div className="relative mx-auto max-w-md rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-6 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--lx-gold)]">Account recovery</p>
        <h1 className="lx-title mt-3 text-3xl">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--lx-muted)]">
          {step === "email" && "Enter your email to receive a reset code."}
          {step === "verify" && `We sent a code to ${email}.`}
          {step === "password" && "Code verified. Choose a new password."}
          {step === "success" && "Password updated."}
        </p>

        {step === "email" && (
          <form onSubmit={sendCode} className="mt-6 space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="lx-field w-full" autoComplete="email" required />
            <Button
              disabled={loading}
              type="submit"
              loading={loading}
              loadingText="Sending…"
              variant="brand"
              size="lg"
              className="w-full"
            >
              Send reset code
            </Button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {otpDigits.map((digit, index) => (
                <input key={index} ref={(node) => { refs.current[index] = node; }} value={digit} onChange={(e) => setDigit(index, e.target.value)} onPaste={handlePaste} maxLength={1} inputMode="numeric" autoComplete="one-time-code" aria-label={`Reset code digit ${index + 1}`} className="lx-field h-12 px-0 text-center text-lg font-bold" />
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-3 py-2 text-xs">
              <span className="text-[var(--lx-muted)]" aria-live="polite">
                {secondsRemaining > 0
                  ? `Code expires in ${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`
                  : "Your code has expired."}
              </span>
              <Button
                type="button"
                onClick={resendCode}
                disabled={resendInSeconds > 0 || resendCount >= 5 || loading}
                className="font-semibold text-[var(--lx-gold)] disabled:text-[var(--lx-faint)]"
              >
                {resendCount >= 5
                  ? "Maximum resends reached"
                  : resendInSeconds > 0
                    ? `Resend in ${resendInSeconds}s`
                    : "Resend code"}
              </Button>
            </div>
            {otpError && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{otpError}</p>}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || otpValue.length !== 6}
                loading={loading}
                loadingText="Verifying…"
                variant="brand"
                size="md"
                className="flex-1"
              >
                Verify code
              </Button>
              <Button
                type="button"
                onClick={() => setStep("email")}
                variant="outline"
                size="md"
              >
                Back
              </Button>
            </div>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={resetPassword} className="mt-6 space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="lx-field w-full" autoComplete="new-password" required minLength={8} />
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className={`h-full transition-all ${strength.label === "Weak" ? "bg-rose-500" : strength.label === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
            </div>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className="lx-field w-full" autoComplete="new-password" required minLength={8} />
            {passwordError && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{passwordError}</p>}
            <Button
              disabled={loading}
              type="submit"
              loading={loading}
              loadingText="Updating…"
              variant="brand"
              size="lg"
              className="w-full"
            >
              Update password
            </Button>
          </form>
        )}

        {step === "success" && <p className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">Redirecting to sign in...</p>}

        <p className="mt-5 text-center text-sm text-[var(--lx-muted)]">
          <Link href="/login" className="text-[var(--lx-gold)] hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}