"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, Loader2, MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";
import { startStoreConversation, toggleFollowStore } from "@/lib/actions/marketplace-buyer";
import { cn } from "@/lib/cn";

export function StoreEngagement({
  storeId,
  storeName,
  storeSlug,
  isAuthenticated,
  initialFollowing,
  followerCount,
}: {
  storeId: string;
  storeName: string;
  storeSlug: string;
  isAuthenticated: boolean;
  initialFollowing: boolean;
  followerCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(followerCount);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "" });
  const loginHref = `/login?next=${encodeURIComponent(`/stores/${storeSlug}`)}`;

  const follow = () => {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }
    startTransition(async () => {
      try {
        const result = await toggleFollowStore(storeId);
        setFollowing(result.following);
        setFollowers((count) => Math.max(0, count + (result.following ? 1 : -1)));
        toast.success(result.following ? `Following ${storeName}.` : `Unfollowed ${storeName}.`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update follow");
      }
    });
  };

  const send = () => {
    if (!form.body.trim()) {
      toast.error("Write a message first.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await startStoreConversation({
          storeId,
          subject: form.subject || `Enquiry for ${storeName}`,
          body: form.body,
        });
        toast.success("Message sent to the store.");
        setOpen(false);
        setForm({ subject: "", body: "" });
        router.push(`/messages?c=${result.conversationId}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not send message");
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={follow}
          disabled={pending}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-60",
            following
              ? "border border-[var(--lx-gold)]/35 bg-[var(--lx-gold)]/10 text-[var(--lx-gold)]"
              : "bg-[var(--lx-text)] text-[var(--lx-bg)] hover:-translate-y-0.5",
          )}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", following && "fill-current")} />}
          {following ? "Following" : "Follow"}
          <span className="text-xs font-normal opacity-70">{followers.toLocaleString("en-US")}</span>
        </Button>
        {isAuthenticated ? (
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="lx-glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-[var(--lx-text)]"
          >
            <MessageCircle className="h-4 w-4" /> Message store
          </Button>
        ) : (
          <Link href={loginHref} className="lx-glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-[var(--lx-text)]">
            <MessageCircle className="h-4 w-4" /> Message store
          </Link>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={`Message ${storeName}`}>
          <div className="w-full max-w-lg rounded-[1.75rem] border border-[var(--lx-border)] bg-[var(--lx-bg)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-gold)]">Private message</p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--lx-text)]">Contact {storeName}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--lx-muted)]">Your message goes directly to the seller. Replies appear in your MeCart messages.</p>
              </div>
              <Button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--lx-border)] text-[var(--lx-muted)] hover:text-[var(--lx-text)]" aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-5 space-y-3">
              <input
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                placeholder="Subject (optional)"
                className="h-11 w-full rounded-xl border border-[var(--lx-border)] bg-white/[0.03] px-3 text-sm text-[var(--lx-text)] outline-none placeholder:text-[var(--lx-muted)] focus:border-[var(--lx-gold)]/50"
              />
              <textarea
                value={form.body}
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                rows={5}
                placeholder="Ask about a piece, delivery or your order…"
                className="w-full resize-none rounded-xl border border-[var(--lx-border)] bg-white/[0.03] px-3 py-3 text-sm leading-6 text-[var(--lx-text)] outline-none placeholder:text-[var(--lx-muted)] focus:border-[var(--lx-gold)]/50"
              />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button type="button" onClick={() => setOpen(false)} className="h-10 rounded-full px-4 text-sm text-[var(--lx-muted)] hover:text-[var(--lx-text)]">Cancel</Button>
              <Button type="button" onClick={send} disabled={pending || !form.body.trim()} className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--lx-text)] px-5 text-sm font-semibold text-[var(--lx-bg)] disabled:opacity-45">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send message
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
