"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { replyToSellerReview } from "@/lib/actions/seller-operations";

export function SellerReviewReply({ reviewId, existingReply }: { reviewId: string; existingReply: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(existingReply ?? "");
  const [pending, startTransition] = useTransition();

  const submit = () => startTransition(async () => {
    try {
      await replyToSellerReview(reviewId, reply);
      toast.success("Reply published.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish reply");
    }
  });

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#f5dfa2] transition hover:underline">
        <MessageSquare className="h-3.5 w-3.5" /> {existingReply ? "Edit reply" : "Reply"}
      </button>
    );
  }

  return (
    <div className="mt-3">
      <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} placeholder="Thank you for your note…" className="w-full resize-none rounded-xl border border-white/10 bg-[#07090f] px-3 py-2.5 text-xs leading-5 text-white outline-none placeholder:text-slate-600 focus:border-[#d8b45a]/40" />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={submit} disabled={pending || reply.trim().length < 2} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#d8b45a] px-3 text-[11px] font-semibold text-[#1e1708] disabled:opacity-50">
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />} Publish
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-3 text-[11px] text-slate-400 hover:text-white">Cancel</button>
      </div>
    </div>
  );
}
