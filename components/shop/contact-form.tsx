"use client";

import { useId, useState } from "react";
import { ArrowUpRight, Check, Copy, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOPICS = [
  "Order support",
  "Product enquiry",
  "Seller partnership",
  "Returns & exchanges",
  "Press",
  "Something else",
] as const;

const CARE_EMAIL = "care@mecart.store";

type Status = "idle" | "sent";

/**
 * Contact composer.
 *
 * MeCart is a static-first storefront without a mail server in this build, so
 * the form composes a complete, prefilled message and hands it to the visitor's
 * mail client. Nothing is silently discarded, and the address is always shown
 * as a fallback if the hand-off fails.
 */
export function ContactForm() {
  const id = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("Order support");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CARE_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(`Copy unavailable. Our address is ${CARE_EMAIL}.`);
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Please tell us your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address so we can reply.");
      return;
    }
    if (message.trim().length < 12) {
      setError("A little more detail will help the atelier answer properly.");
      return;
    }

    const subject = `[${topic}] ${orderNumber ? `Order ${orderNumber} — ` : ""}${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Topic: ${topic}`,
      orderNumber ? `Order: ${orderNumber}` : null,
      "",
      message,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    setStatus("sent");
    window.location.href = `mailto:${CARE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (status === "sent") {
    return (
      <div className="lx-success rounded-[1.6rem] border border-[var(--lx-emerald)]/30 bg-[var(--lx-emerald)]/8 p-6 sm:p-8" role="status">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--lx-emerald)]/40 bg-[var(--lx-emerald)]/15 text-[var(--lx-emerald)]">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="lx-title mt-5 text-2xl">Your message is composed.</h3>
        <p className="lx-prose mt-2 text-sm text-[var(--lx-muted)]">
          Your mail client should have opened with everything prefilled. If it did not, write to{" "}
          <a href={`mailto:${CARE_EMAIL}`} className="font-medium text-[var(--lx-gold)] underline-offset-4 hover:underline">
            {CARE_EMAIL}
          </a>{" "}
          and we will take it from there.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copyEmail}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy address"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setStatus("idle")}>
            Compose another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" aria-describedby={`${id}-note`}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
            Your name
          </span>
          <input
            className="lx-field h-12 w-full"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            minLength={2}
            placeholder="Alexandra Laurent"
          />
        </label>
        <label className="block">
          <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
            Email
          </span>
          <input
            className="lx-field h-12 w-full"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
            Topic
          </span>
          <select
            className="lx-field h-12 w-full"
            value={topic}
            onChange={(event) => setTopic(event.target.value as (typeof TOPICS)[number])}
          >
            {TOPICS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
            Order number <span className="normal-case tracking-normal text-[var(--lx-faint)]">(optional)</span>
          </span>
          <input
            className="lx-field h-12 w-full font-mono text-xs uppercase tracking-[0.08em]"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="MC-10482"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
          Message
        </span>
        <textarea
          className="lx-field min-h-40 w-full resize-y py-3"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          minLength={12}
          placeholder="Tell us what you need — sizing, an order, a piece you cannot find…"
        />
      </label>

      {error ? (
        <p className="lx-error rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p id={`${id}-note`} className="max-w-xs text-[11px] leading-5 text-[var(--lx-faint)]">
          We reply within one business day. Your details are only used to answer this message.
        </p>
        <Button type="submit" variant="brand" size="lg" magnetic className="shrink-0 rounded-full">
          <Send className="h-4 w-4" aria-hidden /> Compose message
        </Button>
      </div>

      <p className="flex items-center gap-2 pt-1 text-xs text-[var(--lx-muted)]">
        <Mail className="h-3.5 w-3.5 text-[var(--lx-gold)]" aria-hidden />
        Prefer email?{" "}
        <a href={`mailto:${CARE_EMAIL}`} className="inline-flex items-center gap-1 text-[var(--lx-gold)] underline-offset-4 hover:underline">
          {CARE_EMAIL}
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </a>
      </p>
    </form>
  );
}
