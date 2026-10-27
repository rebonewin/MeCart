"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Download,
  KeyRound,
  Laptop,
  Loader2,
  Mail,
  Printer,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";

import {
  confirmAuthenticatorSetup,
  confirmContactTwoFactorSetup,
  disableTwoFactorAction,
  regenerateRecoveryCodesAction,
  removeAllTrustedDevices,
  removeTrustedDevice,
  startAuthenticatorSetup,
  startEmailTwoFactorSetup,
  startSmsTwoFactorSetup,
} from "@/lib/actions/two-factor";
import type { TwoFactorMethod, TwoFactorStatusView } from "@/lib/services/two-factor-service";
import { formatDateTime } from "@/lib/utils/date";
import { TotpQr } from "@/components/security/totp-qr";

function methodLabel(method: TwoFactorMethod | null): string {
  if (method === "totp") return "Authenticator app";
  if (method === "email") return "Email OTP";
  if (method === "sms") return "SMS OTP";
  return "Not configured";
}

function formatDate(value: string | null): string {
  return formatDateTime(value);
}

function Modal({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Button
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 w-full ${maxWidth} overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <Button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function RecoveryCodesPanel({
  codes,
  onDismiss,
  dismissLabel = "I've saved my codes",
}: {
  codes: string[];
  onDismiss: () => void;
  dismissLabel?: string;
}) {
  const text = `MeCart two-factor recovery codes\nOne-time use only. Keep these somewhere safe.\n\n${codes.join("\n")}\n`;

  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mecart-recovery-codes.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    const printWindow = window.open("", "_blank", "noopener,width=640,height=760");
    if (!printWindow) {
      toast.error("Allow pop-ups to print your recovery codes.");
      return;
    }
    printWindow.document.write(
      `<!doctype html><html><head><title>MeCart recovery codes</title><style>body{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding:32px;color:#0B0B0F}h1{font-size:16px}li{margin:8px 0;font-size:14px}</style></head><body><h1>MeCart two-factor recovery codes — keep this safe</h1><ul>${codes
        .map((code) => `<li>${code}</li>`)
        .join("")}</ul></body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      toast.success("Recovery codes copied.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
        Save these 10 one-time codes now. Each code works once, and they are the only way
        back in if you lose your device.
      </div>
      <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
        {codes.map((code) => (
          <li
            key={code}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center tracking-wider dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100"
          >
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
        >
          <Download className="h-4 w-4" /> Download
        </Button>
        <Button
          type="button"
          onClick={print}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
        >
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
        >
          <Copy className="h-4 w-4" /> Copy
        </Button>
      </div>
      <Button
        type="button"
        onClick={onDismiss}
        className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-violet-500"
      >
        {dismissLabel}
      </Button>
    </div>
  );
}

type WizardStep =
  | { kind: "password" }
  | { kind: "choose" }
  | { kind: "totp"; otpauthUrl: string; manualKey: string }
  | { kind: "code"; method: "email" | "sms" }
  | { kind: "recovery"; codes: string[] };

function SetupWizard({
  open,
  mode,
  status,
  onClose,
  onDone,
}: {
  open: boolean;
  mode: "enable" | "reconfigure" | "change";
  status: TwoFactorStatusView;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<WizardStep>({ kind: "password" });
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const title =
    mode === "enable" ? "Enable two-factor authentication" : mode === "change" ? "Change 2FA method" : "Reconfigure 2FA";

  const verifyPassword = (event: React.FormEvent) => {
    event.preventDefault();
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setError("");
    setStep({ kind: "choose" });
  };

  const chooseMethod = async (choice: "totp" | "email" | "sms") => {
    setBusy(true);
    setError("");
    try {
      if (choice === "totp") {
        const result = await startAuthenticatorSetup(password);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setStep({ kind: "totp", otpauthUrl: result.otpauthUrl, manualKey: result.manualKey });
        return;
      }

      const result =
        choice === "email"
          ? await startEmailTwoFactorSetup(password)
          : await startSmsTwoFactorSetup(password);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setStep({ kind: "code", method: choice });
      toast.success("Verification code sent.");
    } catch {
      setError("Could not start setup. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result =
        step.kind === "totp"
          ? await confirmAuthenticatorSetup(code)
          : await confirmContactTwoFactorSetup(code);

      if (!result.ok) {
        setError(result.error);
        setCode("");
        return;
      }

      if (result.recoveryCodes && result.recoveryCodes.length > 0) {
        setStep({ kind: "recovery", codes: result.recoveryCodes });
      } else {
        toast.success(result.message);
        onDone();
      }
    } catch {
      setError("Could not confirm the code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const canUseEmail = status.hasRealEmail;
  const canUseSms = status.hasVerifiedPhone && status.smsConfigured;

  return (
    <Modal open={open} title={title} onClose={onClose} maxWidth="max-w-xl">
      {step.kind === "password" && (
        <form onSubmit={verifyPassword} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Confirm your account password to continue. This protects against session hijacking.
          </p>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              autoComplete="current-password"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              placeholder="Enter your password"
            />
          </label>
          {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
          <Button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-violet-500"
          >
            Continue
          </Button>
        </form>
      )}

      {step.kind === "choose" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Choose how you want to verify sign-ins. You can change this later.
          </p>

          <Button
            type="button"
            onClick={() => chooseMethod("totp")}
            disabled={busy}
            className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 disabled:opacity-60 dark:border-white/10 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-500/10"
          >
            <span className="rounded-2xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
              <KeyRound className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-slate-900 dark:text-white">
                Authenticator app
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Google Authenticator, Microsoft Authenticator, Authy, 1Password, Bitwarden — works offline.
              </span>
            </span>
          </Button>

          <Button
            type="button"
            onClick={() => chooseMethod("email")}
            disabled={busy || !canUseEmail}
            className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-500/10"
          >
            <span className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
              <Mail className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-slate-900 dark:text-white">Email OTP</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {canUseEmail
                  ? `6-digit codes to ${status.maskedEmail ?? "your verified email"}`
                  : "Verify a real email address first"}
              </span>
            </span>
          </Button>

          <Button
            type="button"
            onClick={() => chooseMethod("sms")}
            disabled={busy || !canUseSms}
            className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-500/10"
          >
            <span className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
              <Smartphone className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-slate-900 dark:text-white">SMS OTP</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {!status.hasVerifiedPhone
                  ? "Verify a phone number first"
                  : status.smsConfigured
                    ? `6-digit codes to ${status.maskedPhone ?? "your verified phone"}`
                    : `SMS provider not configured (${status.smsMissing.join(", ") || "Twilio"})`}
              </span>
            </span>
          </Button>

          {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
          {busy && (
            <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Sending verification code…
            </p>
          )}
        </div>
      )}

      {step.kind === "totp" && (
        <form onSubmit={confirm} className="space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>Open your authenticator app.</li>
            <li>Scan the QR code, or add the setup key manually.</li>
            <li>Enter the 6-digit code shown in the app.</li>
          </ol>

          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/40">
            <TotpQr value={step.otpauthUrl} />
            <div className="w-full text-center">
              <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Manual setup key
              </p>
              <code className="mt-1 block break-all rounded-xl bg-white px-3 py-2 font-mono text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                {step.manualKey}
              </code>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            6-digit code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-mono text-xl tracking-[0.4em] text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              placeholder="000000"
            />
          </label>

          {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
          <Button
            type="submit"
            disabled={busy || code.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Verify and enable
          </Button>
        </form>
      )}

      {step.kind === "code" && (
        <form onSubmit={confirm} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {step.method === "email"
              ? `Enter the 6-digit code sent to ${status.maskedEmail ?? "your email"}.`
              : `Enter the 6-digit code sent to ${status.maskedPhone ?? "your phone"}.`}
          </p>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Verification code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-mono text-xl tracking-[0.4em] text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              placeholder="000000"
            />
          </label>
          {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
          <Button
            type="submit"
            disabled={busy || code.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Verify and enable
          </Button>
        </form>
      )}

      {step.kind === "recovery" && (
        <RecoveryCodesPanel
          codes={step.codes}
          onDismiss={() => {
            toast.success("Two-factor authentication is active.");
            onDone();
          }}
        />
      )}
    </Modal>
  );
}

function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  loadingLabel,
  danger,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loadingLabel: string;
  danger?: boolean;
  onClose: () => void;
  onSubmit: (input: { password: string; code: string }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await onSubmit({ password, code });
      if (!result.ok) {
        setError(result.error ?? "Action failed.");
        return;
      }
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            autoComplete="current-password"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Current authenticator or recovery code
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
            placeholder="123456 or XXXXX-XXXXX"
          />
        </label>
        {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
        <Button
          type="submit"
          disabled={busy || !password || !code}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-60 ${
            danger
              ? "bg-gradient-to-r from-rose-600 to-red-500 shadow-rose-600/20 hover:from-rose-500 hover:to-red-400"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500"
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? loadingLabel : confirmLabel}
        </Button>
      </form>
    </Modal>
  );
}

export function SecuritySettings({ status }: { status: TwoFactorStatusView }) {
  const router = useRouter();
  const [wizard, setWizard] = useState<"enable" | "reconfigure" | "change" | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  const refresh = () => {
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Two-factor authentication and trusted devices
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" /> Profile
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-5 dark:border-white/10 dark:from-indigo-500/10 dark:to-violet-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`rounded-2xl p-3 ${
                  status.enabled
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                    : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                }`}
              >
                {status.enabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Two-factor authentication
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {status.enabled
                    ? `Enabled · ${methodLabel(status.method)}`
                    : "Not enabled — your account has one layer of protection"}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                status.enabled
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                  : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
              }`}
            >
              {status.enabled ? "Active" : "Off"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Method", methodLabel(status.method)],
            ["Enabled on", formatDate(status.enabledAt)],
            ["Last used", formatDate(status.lastUsedAt)],
            ["Recovery codes", status.enabled ? `${status.recoveryRemaining} left` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/40">
              <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>

        {status.pendingMethod && (
          <div className="mx-6 mb-5 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
            A {methodLabel(status.pendingMethod)} setup is pending confirmation. Restart the setup to
            finish it.
          </div>
        )}

        {status.lockedUntil && (
          <div className="mx-6 mb-5 rounded-2xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100">
            Second-factor verification is locked until {formatDate(status.lockedUntil)} after failed
            attempts.
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-slate-100 px-6 py-5 dark:border-white/10">
          {!status.enabled ? (
            <Button
              type="button"
              onClick={() => setWizard("enable")}
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-violet-500"
            >
              Enable two-factor authentication
            </Button>
          ) : (
            <>
              {status.method === "totp" ? (
                <Button
                  type="button"
                  onClick={() => setWizard("reconfigure")}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <RefreshCw className="mr-2 inline h-4 w-4" />
                  Reconfigure authenticator
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={() => setWizard("change")}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Change method
              </Button>
              <Button
                type="button"
                onClick={() => setRegenOpen(true)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Regenerate recovery codes
              </Button>
              <Button
                type="button"
                onClick={() => setDisableOpen(true)}
                className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
              >
                Disable 2FA
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-white/10 dark:text-slate-200">
              <Laptop className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Trusted devices</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Devices that can skip the second step for 30 days
              </p>
            </div>
          </div>
          {status.trustedDevices.length > 0 && (
            <Button
              type="button"
              onClick={() => {
                void removeAllTrustedDevices().then((result) => {
                  if (result.ok) {
                    toast.success(result.message);
                    refresh();
                  } else {
                    toast.error(result.error);
                  }
                });
              }}
              className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              Sign out all devices
            </Button>
          )}
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-white/10">
          {status.trustedDevices.length === 0 && (
            <li className="px-6 py-6 text-sm text-slate-500 dark:text-slate-400">
              No trusted devices. When you tick &quot;Trust this device&quot; during sign-in, it will
              appear here.
            </li>
          )}
          {status.trustedDevices.map((device) => (
            <li key={device.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                  {device.browser} on {device.os}
                  {device.current && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                      This device
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {device.location ?? "Unknown location"}
                  {device.ip ? ` · ${device.ip}` : ""} · Added {formatDate(device.createdAt)} · Last used{" "}
                  {formatDate(device.lastUsedAt)}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  void removeTrustedDevice(device.id).then((result) => {
                    if (result.ok) {
                      toast.success(result.message);
                      refresh();
                    } else {
                      toast.error(result.error);
                    }
                  });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <SetupWizard
        key={wizard ?? "wizard-closed"}
        open={wizard !== null}
        mode={wizard ?? "enable"}
        status={status}
        onClose={() => setWizard(null)}
        onDone={() => {
          setWizard(null);
          refresh();
        }}
      />

      <ConfirmActionDialog
        key={disableOpen ? "disable-open" : "disable-closed"}
        open={disableOpen}
        title="Disable two-factor authentication"
        description="This removes your authenticator setup, recovery codes and trusted devices. Your account will rely on its password only."
        confirmLabel="Disable 2FA"
        loadingLabel="Disabling…"
        danger
        onClose={() => setDisableOpen(false)}
        onSubmit={async (input) => {
          const result = await disableTwoFactorAction(input);
          if (result.ok) {
            toast.success(result.message);
            refresh();
          }
          return result;
        }}
      />

      <ConfirmActionDialog
        key={regenOpen ? "regen-open" : "regen-closed"}
        open={regenOpen}
        title="Regenerate recovery codes"
        description="Your old recovery codes stop working immediately. You will see the new codes once."
        confirmLabel="Generate new codes"
        loadingLabel="Generating…"
        onClose={() => setRegenOpen(false)}
        onSubmit={async (input) => {
          const result = await regenerateRecoveryCodesAction(input);
          if (result.ok) {
            setNewCodes(result.codes);
            refresh();
            return { ok: true };
          }
          return { ok: false, error: result.error };
        }}
      />

      <Modal open={newCodes !== null} title="New recovery codes" onClose={() => setNewCodes(null)}>
        {newCodes && (
          <RecoveryCodesPanel
            codes={newCodes}
            onDismiss={() => {
              setNewCodes(null);
              toast.success("Recovery codes updated.");
            }}
          />
        )}
      </Modal>
    </div>
  );
}
