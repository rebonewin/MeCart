"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { completePhoneProfile, requestPhoneOtp, verifyPhoneOtp } from "@/lib/actions/phone-otp";

const COUNTRIES = [
  { code: "US", name: "United States", dial: "+1" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
];

type Step = "phone" | "verify" | "profile" | "success";

export default function PhoneLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [country, setCountry] = useState(COUNTRIES[1]);
  const [search, setSearch] = useState("");
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: 6 }, () => ""));
  const [otpError, setOtpError] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const secondsRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const otpValue = otpDigits.join("");

  const filteredCountries = useMemo(() => {
    const term = search.toLowerCase();
    return COUNTRIES.filter((item) => !term || item.name.toLowerCase().includes(term) || item.dial.includes(term));
  }, [search]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const setDigit = (index: number, next: string) => {
    const chars = next.replace(/\D/g, "").slice(0, 1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = chars;
    setOtpDigits(nextDigits);
    if (chars && index < 5) refs.current[index + 1]?.focus();
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = `${country.dial}${number.replace(/\D/g, "")}`;
    setPhone(fullPhone);
    setLoading(true);
    try {
      const result = await requestPhoneOtp(fullPhone);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setExpiresAt(Date.now() + result.expiresInSeconds * 1000);
      setOtpDigits(Array.from({ length: 6 }, () => ""));
      setOtpError("");
      toast.success(result.message);
      setStep("verify");
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
      const result = await verifyPhoneOtp(phone, otpValue);
      if (!result.ok) {
        setOtpError(result.error);
        return;
      }
      toast.success("Phone verified.");
      setStep("profile");
    } finally {
      setLoading(false);
    }
  };

  const finish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await completePhoneProfile({
        phone,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        password: password || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Welcome to MeCart!");
      setStep("success");
      window.setTimeout(() => router.push("/"), 900);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold">Mobile OTP login</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {step === "phone" && "Choose your country and enter your number."}
          {step === "verify" && `Code sent to ${phone}.`}
          {step === "profile" && "Complete your profile (optional)."}
          {step === "success" && "Redirecting home..."}
        </p>

        {step === "phone" && (
          <form onSubmit={sendCode} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Country</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search country" className="mb-2 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950/80" />
              <select value={country.code} onChange={(e) => setCountry(COUNTRIES.find((item) => item.code === e.target.value) ?? COUNTRIES[0])} className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950/80">
                {filteredCountries.map((item) => (
                  <option key={item.code} value={item.code}>{item.name} ({item.dial})</option>
                ))}
              </select>
            </div>
            <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Mobile number" className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950/80" required />
            <button disabled={loading} type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {otpDigits.map((digit, index) => (
                <input key={index} ref={(node) => { refs.current[index] = node; }} value={digit} onChange={(e) => setDigit(index, e.target.value)} onPaste={handlePaste} maxLength={1} inputMode="numeric" className="h-12 rounded-xl border border-gray-200 bg-white/70 text-center text-lg font-bold dark:border-gray-700 dark:bg-gray-950/80" />
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Expires in {String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:{String(secondsRemaining % 60).padStart(2, "0")}</p>
            {otpError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">{otpError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading || otpValue.length !== 6} className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{loading ? "Verifying..." : "Verify"}</button>
              <button type="button" onClick={() => requestPhoneOtp(phone).then((r) => !r.ok && toast.error(r.error))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">Resend</button>
            </div>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={finish} className="mt-6 space-y-3">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name (optional)" className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950/80" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950/80" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (optional)" className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950/80" />
            <button disabled={loading} type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">{loading ? "Finishing..." : "Continue"}</button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/login" className="text-indigo-600 hover:underline dark:text-indigo-400">Back to login</Link>
        </p>
      </div>
    </div>
  );
}