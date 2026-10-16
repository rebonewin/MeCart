"use client";

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-4 py-16 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="relative mx-auto max-w-md rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {step === "email" && "Enter your email to receive a reset code."}
          {step === "verify" && `We sent a code to ${email}.`}
          {step === "password" && "Code verified. Choose a new password."}
          {step === "success" && "Password updated."}
        </p>

        {step === "email" && (
          <form onSubmit={sendCode} className="mt-6 space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950/80" required />
            <button disabled={loading} type="submit" className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">{loading ? "Sending..." : "Send reset code"}</button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {otpDigits.map((digit, index) => (
                <input key={index} ref={(node) => { refs.current[index] = node; }} value={digit} onChange={(e) => setDigit(index, e.target.value)} onPaste={handlePaste} maxLength={1} inputMode="numeric" className="h-12 rounded-2xl border border-gray-200 bg-white/70 text-center text-lg font-bold dark:border-gray-700 dark:bg-gray-950/80" />
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 px-3 py-2 text-xs dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400" aria-live="polite">
                {secondsRemaining > 0
                  ? `Code expires in ${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`
                  : "Your code has expired."}
              </span>
              <button
                type="button"
                onClick={resendCode}
                disabled={resendInSeconds > 0 || resendCount >= 5 || loading}
                className="font-semibold text-indigo-600 disabled:text-gray-400 dark:text-indigo-400 dark:disabled:text-gray-500"
              >
                {resendCount >= 5
                  ? "Maximum resends reached"
                  : resendInSeconds > 0
                    ? `Resend in ${resendInSeconds}s`
                    : "Resend code"}
              </button>
            </div>
            {otpError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">{otpError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading || otpValue.length !== 6} className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{loading ? "Verifying..." : "Verify code"}</button>
              <button type="button" onClick={() => setStep("email")} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">Back</button>
            </div>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={resetPassword} className="mt-6 space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950/80" required minLength={8} />
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div className={`h-full transition-all ${strength.label === "Weak" ? "bg-rose-500" : strength.label === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
            </div>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950/80" required minLength={8} />
            {passwordError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">{passwordError}</p>}
            <button disabled={loading} type="submit" className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">{loading ? "Updating..." : "Update password"}</button>
          </form>
        )}

        {step === "success" && <p className="mt-6 text-sm text-emerald-600">Redirecting to sign in...</p>}

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/login" className="text-indigo-600 hover:underline dark:text-indigo-400">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}