"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Reveal, RippleButton } from "@/components/luxe/primitives";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    setDone(true);
    toast.success("Welcome to the inner circle");
  };

  return (
    <section id="newsletter" className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <div className="lx-card relative overflow-hidden rounded-[2.25rem] p-8 sm:p-12 lg:p-16">
          <div className="lx-blob lx-drift-a left-[-12%] top-[-40%] h-[28rem] w-[28rem] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.4),transparent_65%)]" />
          <div className="lx-blob lx-drift-c right-[-10%] bottom-[-50%] h-[30rem] w-[30rem] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.3),transparent_65%)]" />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--lx-gold)]">
                The inner circle
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--lx-text)] sm:text-4xl lg:text-[2.6rem] lg:leading-[1.1]">
                First access.
                <br />
                <span className="lx-serif text-[var(--lx-gold)]">Zero</span> noise.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-[var(--lx-muted)] sm:text-base">
                Private drops, restock alerts and member-only pricing — one considered email at a time.
              </p>
            </div>

            <div>
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    className="lx-glass flex items-center gap-4 rounded-2xl p-6"
                  >
                    <CheckCircle2 className="h-9 w-9 shrink-0 text-[var(--lx-emerald)]" aria-hidden />
                    <div>
                      <p className="font-semibold text-[var(--lx-text)]">You&apos;re on the list.</p>
                      <p className="mt-1 text-sm text-[var(--lx-muted)]">
                        Welcome to the atelier — watch your inbox for the next drop.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    className="space-y-4"
                  >
                    <label className="lx-glass flex h-14 items-center gap-3 rounded-2xl px-5 transition focus-within:border-[var(--lx-gold)]/45 focus-within:bg-[var(--lx-surface)]">
                      <Mail className="h-5 w-5 shrink-0 text-[var(--lx-muted)]" aria-hidden />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        aria-label="Email address"
                        className="w-full bg-transparent text-sm text-[var(--lx-text)] outline-none placeholder:text-[var(--lx-muted)]/70 sm:text-base"
                      />
                    </label>
                    <RippleButton type="submit" size="lg" variant="gold" className="w-full">
                      Subscribe to the drop
                      <Send className="h-4 w-4" aria-hidden />
                    </RippleButton>
                    <p className="text-center text-[11px] text-[var(--lx-muted)]">
                      No spam, ever. Unsubscribe in one click.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
