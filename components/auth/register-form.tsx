"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { completeRegistration, requestRegistrationOtp, verifyOtpCode } from "@/lib/actions/email-otp";
import { passwordStrength } from "@/lib/auth/password-strength";
import { createClient } from "@/lib/supabase/client";

type Step = "details" | "verify" | "password" | "success";

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const setDigit = (index: number, next: string) => {
    const chars = next.replace(/\D/g, "").slice(0, 1);
    const nextDigits = [...value];
    nextDigits[index] = chars;
    onChange(nextDigits);
    if (chars && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    event.preventDefault();
    const next = [...value];
    for (let i = 0; i < 6; i += 1) next[i] = pasted[i] ?? "";
    onChange(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    refs.current[5]?.focus();
  };

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-3" aria-label="Six digit one-time code">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(node) => { refs.current[index] = node; return undefined; }}
          value={digit}
          onChange={(event) => setDigit(index, event.target.value)}
          onPaste={handlePaste}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && digit === "" && index > 0) {
              event.preventDefault();
              refs.current[index - 1]?.focus();
            }
          }}
          autoFocus={index === 0}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className="h-14 w-full rounded-2xl border border-white/60 bg-white/90 text-center text-xl font-bold text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      ))}
    </div>
  );
}

function CountDownTimer({
  remaining,
  resendInSeconds,
  resendCount,
  onResend,
}: {
  remaining: number;
  resendInSeconds: number;
  resendCount: number;
  onResend: () => void;
}) {
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const maxed = resendCount >= 5;
  const disabled = resendInSeconds > 0 || maxed;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-indigo-50/70 px-4 py-2 text-sm dark:bg-indigo-950/30">
      <span className="text-gray-600 dark:text-gray-400" aria-live="polite">
        {remaining > 0
          ? `Code expires in ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
          : "Your code has expired — request a new one."}
      </span>
      <button
        type="button"
        onClick={onResend}
        disabled={disabled}
        aria-disabled={disabled}
        className="font-medium text-indigo-600 hover:underline disabled:text-gray-400 disabled:no-underline dark:text-indigo-400 dark:disabled:text-gray-500"
      >
        {maxed
          ? "Maximum resends reached"
          : resendInSeconds > 0
            ? `Resend in ${resendInSeconds}s`
            : "Resend code"}
      </button>
    </div>
  );
}

function PasswordChecks({
  checks,
}: {
  checks: ReturnType<typeof passwordStrength>["checks"];
}) {
  const labels: [string, boolean][] = [
    ["8 or more characters", checks.length],
    ["Uppercase letter", checks.uppercase],
    ["Lowercase letter", checks.lowercase],
    ["Number", checks.number],
    ["Special character", checks.special],
  ];

  return (
    <ul className="space-y-1 text-xs" aria-label="Password requirements">
      {labels.map(([label, ok]) => (
        <li key={label} className={ok ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}>
          {ok ? "✓" : "•"} {label}
        </li>
      ))}
    </ul>
  );
}

export function RegisterForm({ resumeEmail }: { resumeEmail: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: 6 }, () => ""));
  const [otpError, setOtpError] = useState("");

  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [resendCount, setResendCount] = useState(0);

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

  // Deep link from /verify-email for OTP-first accounts that verified their
  // mailbox but never created a password. Requires the verified session.
  useEffect(() => {
    if (!resumeEmail) return;

    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user?.email?.toLowerCase() === resumeEmail) {
          setEmail(resumeEmail);
          setStep("password");
          toast.info("Email verified — create your password to finish.");
        }
      })
      .catch(() => null);
  }, [resumeEmail]);

  const startVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const result = await requestRegistrationOtp({ name: name.trim(), email: email.trim() });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setExpiresAt(Date.now() + result.expiresInSeconds * 1000);
      setResendAvailableAt(Date.now() + result.resendAvailableInSeconds * 1000);
      setResendCount(0);
      setOtpDigits(Array.from({ length: 6 }, () => ""));
      setOtpError("");
      toast.success(result.message);
      setStep("verify");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send the verification code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otpValue.length !== 6) {
      setOtpError("Enter all 6 code digits.");
      return;
    }
    setLoading(true);
    setOtpError("");
    try {
      const result = await verifyOtpCode("registration", { email: email.trim(), token: otpValue, name: name.trim() });
      if (!result.ok) {

        setOtpError(result.error);
        return;
      }
      toast.success("Email verified. Create your password next.");
      setStep("password");
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCount >= 5) {
      toast.error("Maximum resend attempts reached. Please wait.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestRegistrationOtp({ name: name.trim(), email: email.trim() });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setResendCount(result.resendCount || resendCount + 1);
      setExpiresAt(Date.now() + result.expiresInSeconds * 1000);
      setResendAvailableAt(Date.now() + result.resendAvailableInSeconds * 1000);
      setOtpDigits(Array.from({ length: 6 }, () => ""));
      setOtpError("");
      toast.success(result.message);
    } finally {
      setLoading(false);
    }
  };

  const createPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setLoading(true);
    try {
      const result = await completeRegistration({ email: email.trim(), password, confirm });
      if (!result.ok) {
        setPasswordError(result.error);
        return;
      }
      toast.success("Welcome to MeCart! Your account is ready.");
      setStep("success");
      window.setTimeout(() => router.push("/?welcome=1"), 1200);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-4 py-16 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -top-24 right-8 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-8 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />

      <div className="relative mx-auto max-w-md">
        <div className="mb-6 text-center">
          <span className="rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 backdrop-blur dark:border-gray-700 dark:bg-gray-900/70 dark:text-indigo-300">
            MeCart Email Verification
          </span>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(["details", "verify", "password", "success"] as Step[]).map((item, index) => (
              <div
                key={item}
                className={`h-2 w-8 rounded-full transition ${["details", "verify", "password", "success"].indexOf(step) >= index ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600">Create account</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {step === "details" && "Enter your name and email to receive a 6-digit code."}
                {step === "verify" && `We sent a code to ${email}.`}
                {step === "password" && "Your email is verified. Create your password."}
                {step === "success" && "Your MeCart account is ready."}
              </p>
            </div>
          </div>

          {step === "details" && (
            <form onSubmit={startVerification} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium dark:text-gray-300" htmlFor="register-name">Full name</label>
                <input
                  id="register-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-950/80"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium dark:text-gray-300" htmlFor="register-email">Email address</label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-950/80"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending code..." : "Continue"}
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={verifyOtp} className="space-y-5">
              <OtpInput value={otpDigits} onChange={setOtpDigits} disabled={loading} />
              <CountDownTimer
                remaining={secondsRemaining}
                resendInSeconds={resendInSeconds}
                resendCount={resendCount}
                onResend={resendOtp}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter all 6 code digits. You can resend after the timer.
              </p>
              {otpError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">{otpError}</p>}
              <div className="flex items-center gap-3">
                <button type="submit" disabled={loading || otpValue.length !== 6} className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40">
                  {loading ? "Verifying..." : "Verify code"}
                </button>
                <button type="button" onClick={() => setStep("details")} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition dark:border-gray-700 dark:text-gray-200">
                  Back
                </button>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={createPassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium dark:text-gray-300" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-950/80"
                  required
                />
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div
                      className={`h-full transition-all duration-300 ${strength.label === "Weak" ? "bg-rose-500" : strength.label === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Strength: {strength.label}</p>
                  <PasswordChecks checks={strength.checks} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium dark:text-gray-300" htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-950/80"
                  required
                />
              </div>
              {passwordError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">{passwordError}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-900/40">✓</div>
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">Account created</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Redirecting you home...</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
