"use client";

import { Button } from "@/components/ui/button";
import { LiquidStage } from "@/components/luxe/webgl/liquid-stage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
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
          className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.045] text-center text-xl font-bold text-[var(--lx-text)] outline-none transition focus:border-[var(--lx-gold)] focus:bg-white/[0.07] disabled:opacity-50"
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm">
      <span className="text-[var(--lx-muted)]" aria-live="polite">
        {remaining > 0
          ? `Code expires in ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
          : "Your code has expired — request a new one."}
      </span>
      <Button
        type="button"
        variant="ghost"
        onClick={onResend}
        disabled={disabled}
        aria-disabled={disabled}
        className="font-medium text-[var(--lx-gold)] hover:text-[var(--lx-champagne-warm)] disabled:text-white/35 disabled:no-underline"
      >
        {maxed
          ? "Maximum resends reached"
          : resendInSeconds > 0
            ? `Resend in ${resendInSeconds}s`
            : "Resend code"}
      </Button>
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
    <div className="dark lx-dark-scene relative min-h-screen overflow-hidden bg-[var(--lx-bg)] px-4 py-16 text-[var(--lx-text)]">
      <LiquidStage variant="hero" intensity={0.7} />

      <div className="relative mx-auto max-w-md">
        <div className="mb-6 text-center">
          <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--lx-gold)] backdrop-blur">
            MeCart Email Verification
          </span>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(["details", "verify", "password", "success"] as Step[]).map((item, index) => (
              <div
                key={item}
                className={`h-1.5 w-8 rounded-full transition ${["details", "verify", "password", "success"].indexOf(step) >= index ? "bg-[var(--lx-gold)]" : "bg-white/15"}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className="lx-glass rounded-[1.75rem] bg-white/[0.055] p-6 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="lx-title text-3xl text-[var(--lx-text)]">Create account</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--lx-muted)]">
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
                <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--lx-muted)]" htmlFor="register-name">Full name</label>
                <input
                  id="register-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  className="lx-field w-full"
                  autoComplete="name"
                  required
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--lx-muted)]" htmlFor="register-email">Email address</label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  className="lx-field w-full"
                  autoComplete="email"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                loadingText="Sending code…"
                variant="brand"
                size="lg"
                className="w-full rounded-2xl"
              >
                Continue
              </Button>
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
              <p className="text-xs text-[var(--lx-muted)]">
                Enter all 6 code digits. You can resend after the timer.
              </p>
              {otpError && <p className="lx-error rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{otpError}</p>}
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={loading || otpValue.length !== 6}
                  loading={loading}
                  loadingText="Verifying…"
                  variant="brand"
                  size="md"
                  className="flex-1 rounded-2xl"
                >
                  Verify code
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep("details")}
                  variant="outline"
                  size="md"
                  className="rounded-2xl"
                >
                  Back
                </Button>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={createPassword} className="space-y-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--lx-muted)]" htmlFor="password">
                  <Lock className="h-3.5 w-3.5" aria-hidden /> Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="lx-field h-12 w-full bg-white/[0.045]"
                  autoComplete="new-password"
                  required
                />
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full transition-all duration-300 ${strength.label === "Weak" ? "bg-rose-500" : strength.label === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[var(--lx-muted)]">
                    Strength: {strength.label}
                  </p>
                  <PasswordChecks checks={strength.checks} />
                </div>
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--lx-muted)]" htmlFor="confirm">
                  <Lock className="h-3.5 w-3.5" aria-hidden /> Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Confirm password"
                  className="lx-field h-12 w-full bg-white/[0.045]"
                  autoComplete="new-password"
                  required
                />
              </div>
              {passwordError && <p className="lx-error rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{passwordError}</p>}
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                loadingText="Creating account…"
                variant="brand"
                size="lg"
                className="w-full rounded-2xl"
              >
                Create account
              </Button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-900/40">✓</div>
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">Account created</h2>
              <p className="mt-2 text-sm text-[var(--lx-muted)]">Redirecting you home...</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-[var(--lx-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--lx-gold-soft)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
