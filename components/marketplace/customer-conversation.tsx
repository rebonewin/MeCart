"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { markCustomerMessagesRead, sendCustomerMessage } from "@/lib/actions/marketplace-buyer";
import { dateTimeLabel } from "@/lib/marketplace/format";
import { cn } from "@/lib/cn";

type Message = {
  id: string;
  body: string;
  sender_type: string;
  created_at: string;
  read_at: string | null;
};

export function CustomerConversation({
  conversationId,
  subject,
  storeName,
  status,
  messages,
}: {
  conversationId: string;
  subject: string;
  storeName: string;
  status: string;
  messages: Message[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const value = body.trim();
    if (!value) return;
    startTransition(async () => {
      try {
        await sendCustomerMessage(conversationId, value);
        setBody("");
        router.refresh();
        endRef.current?.scrollIntoView({ block: "end" });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not send message");
      }
    });
  };

  const markRead = () => startTransition(async () => {
    try {
      await markCustomerMessagesRead(conversationId);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not mark read");
    }
  });

  return (
    <div className="flex min-h-[540px] flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--lx-border)] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-[var(--lx-text)]">{subject}</p>
          <p className="mt-0.5 text-[11px] text-[var(--lx-muted)]">{storeName} · {status.toLowerCase()}</p>
        </div>
        <button type="button" onClick={markRead} disabled={pending} className="rounded-full border border-[var(--lx-border)] px-3 py-1.5 text-[10px] text-[var(--lx-muted)] hover:text-[var(--lx-text)] disabled:opacity-50">
          Mark read
        </button>
      </div>
      <div className="flex-1 space-y-4 bg-black/10 p-5">
        {messages.length === 0 && <p className="py-10 text-center text-xs text-[var(--lx-muted)]">No messages yet.</p>}
        {messages.map((message) => {
          const mine = message.sender_type === "CUSTOMER";
          return (
            <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6", mine ? "bg-[var(--lx-text)] text-[var(--lx-bg)]" : "border border-[var(--lx-border)] bg-[var(--lx-surface)] text-[var(--lx-text)]")}>
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={cn("mt-1.5 text-[9px]", mine ? "text-[var(--lx-bg)]/55" : "text-[var(--lx-faint)]")}>
                  {message.sender_type === "STAFF" ? "MeCart support · " : message.sender_type === "VENDOR" ? "Seller · " : ""}
                  {dateTimeLabel(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="border-t border-[var(--lx-border)] p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Write a reply… (Ctrl + Enter to send)"
            className="min-h-[46px] flex-1 resize-none rounded-2xl border border-[var(--lx-border)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--lx-text)] outline-none placeholder:text-[var(--lx-muted)] focus:border-[var(--lx-gold)]/50"
          />
          <button type="button" onClick={send} disabled={pending || !body.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--lx-text)] text-[var(--lx-bg)] transition hover:opacity-90 disabled:opacity-40" aria-label="Send message">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--lx-faint)]"><CheckCheck className="h-3 w-3" /> Private to you, the seller and MeCart support.</p>
      </div>
    </div>
  );
}
