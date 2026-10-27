"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { SMS_COUNTRIES, type SmsCountry } from "@/lib/sms/countries";
import { isValidE164, toE164 } from "@/lib/sms/phone";
import {
  completePhoneProfile,
  createPhoneOtpChallenge,
  getPhoneOtpSetupStatus,
  requestPhoneOtp,
  verifyPhoneOtp,
} from "@/lib/actions/phone-otp";
import type { OtpChallenge } from "@/lib/sms/signing";

type Step = "phone" | "verify" | "profile" | "success";

const EMPTY_DIGITS = () => Array.from({ length: 6 }, () => "");

function getDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = window.localStorage.getItem("mecart-device-id");
    if (!id) {
      id = window.crypto?.randomUUID?.() ?? `dev-${Math.random().toString(36).slice(2)}-${Date.now()}`;
      window.localStorage.setItem("mecart-device-id", id);
    }
    return id;
  } catch {
    return null;
  }
}

function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export default function PhoneLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [country, setCountry] = useState<SmsCountry>(SMS_COUNTRIES[0]);
  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [number, setNumber] = useState("");

  const [phone, setPhone] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_DIGITS);
  const [otpError, setOtpError] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const [maxResends, setMaxResends] = useState(3);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [setup, setSetup] = useState<{ provider: string; configured: boolean; missing: string[] } | null>(null);

  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const autoSubmitRef = useRef(false);

  const otpValue = otpDigits.join("");
  const secondsRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const resendIn = resendAvailableAt ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000)) : 0;

  const filteredCountries = useMemo(() => {
    const term = countrySearch.trim().toLowerCase();
    if (!term) return SMS_COUNTRIES;
    return SMS_COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.dial.includes(term) ||
        item.code.toLowerCase() === term,
    );
  }, [countrySearch]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    getPhoneOtpSetupStatus()
      .then((status) => setSetup(status))
      .catch(() => setSetup(null));
  }, []);

  const sendOtp = useCallback(
    async (mode: "send" | "resend") => {
      const fullPhone = toE164(country.dial, number);
      if (!isValidE164(fullPhone)) {
        toast.error("Enter a valid mobile number in international format.");
        return;
      }
      setLoading(true);
      try {
        const deviceId = getDeviceId();
        const challengeResult = await createPhoneOtpChallenge({
          phone: fullPhone,
          purpose: "login",
          deviceId,
        });
        if (!challengeResult.ok) {
          toast.error(challengeResult.error);
          return;
        }

        const result = await requestPhoneOtp(fullPhone, {
          purpose: "login",
          deviceId,
          countryCode: country.code,
          challenge: challengeResult.challenge,
        });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        setPhone(fullPhone);
        setChallenge(challengeResult.challenge);
        setExpiresAt(Date.now() + result.expiresInSeconds * 1000);
        setResendAvailableAt(Date.now() + result.resendAvailableInSeconds * 1000);
        setResendCount(result.resendCount);
        setMaxResends(result.maxResends);
        setOtpDigits(EMPTY_DIGITS());
        setOtpError("");
        setStep("verify");
        toast.success(mode === "resend" ? "A new code is on its way." : result.message);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not send the code.");
      } finally {
        setLoading(false);
      }
    },
    [country, number],
  );

  const verify = useCallback(async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setOtpError("Enter all 6 digits.");
      return;
    }
    setLoading(true);
    setOtpError("");
    try {
      const result = await verifyPhoneOtp(phone, code, {
        purpose: "login",
        deviceId: getDeviceId(),
        countryCode: country.code,
        challenge,
      });

      if (!result.ok) {
        setOtpError(result.error);
        return;
      }

      if (result.requiresTwoFactor && result.redirectTo) {
        toast.success(result.message);
        window.location.assign(result.redirectTo);
        return;
      }

      if (result.needsProfile) {
        toast.success(result.message);
        setStep("profile");
        return;
      }

      toast.success(result.message);
      setStep("success");
      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 700);
    } finally {
      setLoading(false);
    }
  }, [otpDigits, phone, country, challenge, router]);

  // Auto-submit as soon as all six digits are present.
  useEffect(() => {
    if (step !== "verify" || loading) {
      autoSubmitRef.current = false;
      return;
    }
    if (otpDigits.every((digit) => digit !== "") && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      void verify();
    }
  }, [otpDigits, step, loading, verify]);

  const setDigit = (index: number, next: string) => {
    const char = next.replace(/\D/g, "").slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    autoSubmitRef.current = false;
    setOtpDigits(nextDigits);
    if (char && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      event.preventDefault();
      const nextDigits = [...otpDigits];
      nextDigits[index - 1] = "";
      setOtpDigits(nextDigits);
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const nextDigits = EMPTY_DIGITS();
    for (let index = 0; index < 6; index += 1) nextDigits[index] = pasted[index] ?? "";
    autoSubmitRef.current = false;
    setOtpDigits(nextDigits);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const finishProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        try {
          const formData = new FormData();
          formData.append("files", avatarFile);
          formData.append("bucket", "avatars");
          formData.append("folder", "phone-signup");
          const upload = await fetch("/api/upload", { method: "POST", body: formData });
          const payload = (await upload.json().catch(() => null)) as { urls?: string[] } | null;
          if (upload.ok && payload?.urls?.[0]) avatarUrl = payload.urls[0];
        } catch {
          // Avatar upload is optional — continue without blocking signup.
        }
      }

      const result = await completePhoneProfile({
        phone,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        avatarUrl,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Welcome to MeCart!");
      setStep("success");
      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 900);
    } finally {
      setLoading(false);
    }
  };

  const resendDisabled = loading || resendIn > 0 || resendCount >= maxResends;

  return (
    <div className="lx-dark-scene relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(212,175,55,0.22),transparent),radial-gradient(40%_40%_at_85%_90%,rgba(230,199,104,0.10),transparent)]" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--lx-gold-soft)]">MeCart Access</p>
        <h1 className="mt-2 text-2xl font-bold text-white">
          {step === "phone" && "Continue with Mobile"}
          {step === "verify" && "Enter verification code"}
          {step === "profile" && "A few last details"}
          {step === "success" && "You're in"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {step === "phone" && "We'll text you a 6-digit code. Standard rates may apply."}
          {step === "verify" && `Code sent to ${phone}. It expires in 5 minutes.`}
          {step === "profile" && "Full name is required — email and avatar are optional."}
          {step === "success" && "Taking you to the storefront…"}
        </p>

        {setup && !setup.configured && (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            SMS provider <span className="font-semibold">{setup.provider}</span> is not configured yet.
            Missing: <span className="font-mono">{setup.missing.join(", ") || "unknown"}</span>.
          </div>
        )}

        {step === "phone" && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendOtp("send");
            }}
            className="mt-6 space-y-4"
          >
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-slate-200">Country</label>
              <Button
                type="button"
                onClick={() => setCountryOpen((open) => !open)}
                aria-expanded={countryOpen}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-white transition hover:border-[var(--lx-gold)]/40"
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden>{country.flag}</span>
                  <span>{country.name}</span>
                </span>
                <span className="text-slate-400">{country.dial}</span>
              </Button>

              {countryOpen && (
                <div
                  className="lx-menu absolute z-20 mt-2 w-full overflow-hidden"
                  role="listbox"
                  aria-label="Country codes"
                >
                  <input
                    autoFocus
                    value={countrySearch}
                    onChange={(event) => setCountrySearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setCountryOpen(false);
                    }}
                    placeholder="Search country or dial code"
                    className="w-full border-b border-white/10 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <ul className="max-h-56 overflow-y-auto">
                    {filteredCountries.map((item) => (
                      <li key={item.code}>
                        <Button
                          type="button"
                          role="option"
                          aria-selected={item.code === country.code}
                          onClick={() => {
                            setCountry(item);
                            setCountryOpen(false);
                            setCountrySearch("");
                          }}
                          className="lx-menu-item flex w-full justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <span aria-hidden>{item.flag}</span>
                            {item.name}
                          </span>
                          <span className="text-slate-500">{item.dial}</span>
                        </Button>
                      </li>
                    ))}
                    {filteredCountries.length === 0 && (
                      <li className="px-3 py-3 text-sm text-slate-500">No matching country</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="mobile-number" className="mb-1 block text-sm font-medium text-slate-200">
                Mobile number
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 focus-within:border-[var(--lx-gold)]/60">
                <span className="text-sm text-slate-400">{country.dial}</span>
                <input
                  id="mobile-number"
                  value={number}
                  onChange={(event) => setNumber(event.target.value.replace(/[^\d\s]/g, ""))}
                  placeholder="98765 43210"
                  autoComplete="tel-national"
                  inputMode="tel"
                  required
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Digits only — we format the +{country.code.replace("+", "")} prefix for you.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              loadingText="Sending…"
              variant="brand"
              size="lg"
              magnetic
              className="w-full"
            >
              Send OTP
            </Button>
          </form>
        )}

        {step === "verify" && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void verify();
            }}
            className="mt-6 space-y-4"
          >
            <div className="grid grid-cols-6 gap-2" role="group" aria-label="One-time passcode">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    refs.current[index] = node;
                  }}
                  value={digit}
                  onChange={(event) => setDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  maxLength={1}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${index + 1}`}
                  className="h-13 w-full rounded-xl border border-white/10 bg-slate-900/70 py-3 text-center text-lg font-bold text-white outline-none transition focus:border-[var(--lx-gold)]/70 focus:ring-2 focus:ring-[var(--lx-ring)]"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Expires in {formatCountdown(secondsRemaining)}</span>
              <span>
                {Math.min(resendCount, maxResends)}/{maxResends} resends used
              </span>
            </div>

            {otpError && (
              <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {otpError}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || otpValue.length !== 6}
                variant="brand"
                size="md"
                className="flex-1 rounded-full"
              >
                {loading ? "Verifying…" : "Verify"}
              </Button>
              <Button
                type="button"
                onClick={() => void sendOtp("resend")}
                disabled={resendDisabled}
                title={resendCount >= maxResends ? "Resend limit reached — request a new code later" : undefined}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5 disabled:opacity-40"
              >
                {resendIn > 0 ? `Resend ${resendIn}s` : "Resend"}
              </Button>
            </div>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={finishProfile} className="mt-6 space-y-3">
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              required
              minLength={2}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[var(--lx-gold)]/55"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email (optional)"
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[var(--lx-gold)]/55"
            />
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-white/15 bg-slate-900/40 px-3 py-3 text-sm text-slate-300 transition hover:border-[var(--lx-gold)]/35">
              <span>{avatarFile ? avatarFile.name : "Upload avatar (optional)"}</span>
              <span className="text-xs text-slate-500">PNG / JPG</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <Button
              type="submit"
              disabled={loading}
              variant="brand"
              size="md"
              className="w-full rounded-full"
            >
              {loading ? "Creating account…" : "Finish"}
            </Button>
          </form>
        )}

        {step === "success" && (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-2xl">✓</div>
            <p className="text-sm text-slate-300">Verified and signed in. Redirecting…</p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/login" className="text-[var(--lx-gold-soft)] transition hover:text-[var(--lx-champagne)]">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
