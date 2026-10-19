"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Smartphone, Trash2 } from "lucide-react";

import { SMS_COUNTRIES, findCountry, type SmsCountry } from "@/lib/sms/countries";
import { isValidE164, toE164 } from "@/lib/sms/phone";
import {
  changePhoneNumber,
  createPhoneOtpChallenge,
  linkPhoneNumber,
  unlinkPhoneNumber,
  verifyPhoneOtp,
} from "@/lib/actions/phone-otp";
import type { OtpChallenge } from "@/lib/sms/signing";

export type PhoneInfo = {
  number: string | null;
  countryCode: string | null;
  verified: boolean;
  verifiedAt: string | null;
  provider: string | null;
  blockedUntil?: string | null;
};

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

export function PhoneSettings({ initialPhone }: { initialPhone: PhoneInfo }) {
  const router = useRouter();

  const [mode, setMode] = useState<"idle" | "form" | "verify">("idle");
  const [intent, setIntent] = useState<"link" | "change">("link");
  const [country, setCountry] = useState<SmsCountry>(
    () => findCountry(initialPhone.countryCode) ?? SMS_COUNTRIES[0],
  );
  const [number, setNumber] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [digits, setDigits] = useState<string[]>(Array.from({ length: 6 }, () => ""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const countryInfo = useMemo(
    () => findCountry(initialPhone.countryCode),
    [initialPhone.countryCode],
  );

  const reset = useCallback(() => {
    setMode("idle");
    setNumber("");
    setDigits(Array.from({ length: 6 }, () => ""));
    setChallenge(null);
    setError("");
  }, []);

  const start = async (nextIntent: "link" | "change") => {
    const fullPhone = toE164(country.dial, number);
    if (!isValidE164(fullPhone)) {
      toast.error("Enter a valid mobile number.");
      return;
    }
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const challengeResult = await createPhoneOtpChallenge({
        phone: fullPhone,
        purpose: nextIntent,
        deviceId,
      });
      if (!challengeResult.ok) {
        toast.error(challengeResult.error);
        return;
      }

      const send =
        nextIntent === "change"
          ? await changePhoneNumber({
              phone: fullPhone,
              challenge: challengeResult.challenge,
              deviceId,
              countryCode: country.code,
            })
          : await linkPhoneNumber({
              phone: fullPhone,
              challenge: challengeResult.challenge,
              deviceId,
              countryCode: country.code,
            });

      if (!send.ok) {
        toast.error(send.error);
        return;
      }

      setIntent(nextIntent);
      setChallenge(challengeResult.challenge);
      setDigits(Array.from({ length: 6 }, () => ""));
      setError("");
      setMode("verify");
      toast.success(send.message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fullPhone = toE164(country.dial, number);
      const result = await verifyPhoneOtp(fullPhone, code, {
        purpose: intent,
        deviceId: getDeviceId(),
        countryCode: country.code,
        challenge,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast.success(result.message);
      reset();
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove the phone number from your account?")) return;
    setBusy(true);
    try {
      const result = await unlinkPhoneNumber();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      reset();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const setDigit = (index: number, next: string) => {
    const char = next.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);
    if (char && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const nextDigits = [...digits];
      nextDigits[index - 1] = "";
      setDigits(nextDigits);
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const nextDigits = Array.from({ length: 6 }, (_, index) => pasted[index] ?? "");
    setDigits(nextDigits);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Smartphone className="h-4 w-4" /> Phone Number
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Secure sign-in and order updates via SMS OTP.
          </p>
        </div>
        {initialPhone.verified ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            {initialPhone.number ? "Unverified" : "Not linked"}
          </span>
        )}
      </div>

      {initialPhone.number && (
        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Number</dt>
            <dd className="font-medium">{initialPhone.number}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Country</dt>
            <dd className="font-medium">
              {countryInfo ? `${countryInfo.flag} ${countryInfo.name}` : initialPhone.countryCode ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Verified on</dt>
            <dd className="font-medium">
              {initialPhone.verifiedAt ? new Date(initialPhone.verifiedAt).toLocaleString() : "—"}
            </dd>
          </div>
        </dl>
      )}

      {mode === "idle" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {!initialPhone.number && (
            <button
              onClick={() => {
                setIntent("link");
                setMode("form");
              }}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Add phone number
            </button>
          )}
          {initialPhone.number && !initialPhone.verified && (
            <button
              onClick={() => {
                setIntent("link");
                setNumber(initialPhone.number?.replace(/^\+\d+/, "") ?? "");
                setMode("form");
              }}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Verify phone
            </button>
          )}
          {initialPhone.number && (
            <>
              <button
                onClick={() => {
                  setIntent("change");
                  setMode("form");
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-700"
              >
                Change number
              </button>
              <button
                onClick={() => void remove()}
                disabled={busy}
                className="flex items-center gap-1 rounded-md border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 disabled:opacity-50 dark:border-rose-500/40 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </>
          )}
        </div>
      )}

      {mode === "form" && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={country.code}
              onChange={(event) =>
                setCountry(SMS_COUNTRIES.find((item) => item.code === event.target.value) ?? SMS_COUNTRIES[0])
              }
              className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {SMS_COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.flag} {item.name} ({item.dial})
                </option>
              ))}
            </select>
            <input
              value={number}
              onChange={(event) => setNumber(event.target.value.replace(/[^\d\s]/g, ""))}
              placeholder="Mobile number"
              inputMode="tel"
              className="flex-1 rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void start(intent)}
              disabled={loading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send code"}
            </button>
            <button
              onClick={reset}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "verify" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void verify();
          }}
          className="mt-4 space-y-3"
        >
          <div className="grid max-w-xs grid-cols-6 gap-2">
            {digits.map((digit, index) => (
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
                className="h-10 rounded border text-center text-base font-bold dark:border-gray-700 dark:bg-gray-800"
              />
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || digits.join("").length !== 6}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
            <button type="button" onClick={reset} className="rounded-md border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
