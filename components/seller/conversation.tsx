"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { markSellerMessagesRead, sendSellerMessage, updateConversationStatus } from "@/lib/actions/seller-operations";
import { dateTimeLabel } from "@/lib/marketplace/format";
import { cn } from "@/lib/cn";

type Message = {
  id: string;
  body: string;
  sender_type: string;
  created_at: string;
  read_at: string | null;
};

export function SellerConversation({
  conversationId,
  subject,
  customerName,
  customerEmail,
  status,
  messages,
}: {
  conversationId: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  status: string;
  messages: Message[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = () => {
    const value = body.trim();
    if (!value) return;
    startTransition(async () => {
      try {
        await sendSellerMessage(conversationId, value);
        setBody("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not send message");
      }
    });
  };

  const markRead = () => startTransition(async () => {
    try {
      await markSellerMessagesRead(conversationId);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not mark read");
    }
  });

  const resolve = () => startTransition(async () => {
    try {
      await updateConversationStatus(conversationId, status === "RESOLVED" ? "OPEN" : "RESOLVED");
      toast.success(status === "RESOLVED" ? "Conversation reopened." : "Conversation resolved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update conversation");
    }
  });

  return (
    <div className="flex min-h-[560px] flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-white">{subject}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{customerName} · {customerEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={markRead} disabled={pending} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-slate-400 hover:text-white disabled:opacity-50">
            Mark read
          </Button>
          <Button type="button" onClick={resolve} disabled={pending} className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-medium text-[#E6C768] disabled:opacity-50">
            {status === "RESOLVED" ? "Reopen" : "Resolve"}
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#101116]/60 p-5">
        {messages.length === 0 && <p className="py-10 text-center text-xs text-slate-600">No messages yet. Start the conversation.</p>}
        {messages.map((message) => {
          const mine = message.sender_type === "VENDOR";
          return (
            <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6", mine ? "bg-[#D4AF37] text-[#0B0B0F]" : "border border-white/[0.07] bg-white/[0.04] text-slate-200")}>
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={cn("mt-1.5 text-[9px]", mine ? "text-[#0B0B0F]/60" : "text-slate-600")}>
                  {message.sender_type === "STAFF" ? "MeCart support · " : ""}{dateTimeLabel(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/[0.07] p-4">
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
            className="min-h-[46px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#D4AF37]/40"
          />
          <Button type="button" onClick={send} disabled={pending || !body.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-[#0B0B0F] transition hover:bg-[#E6C768] disabled:opacity-40" aria-label="Send message">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600"><CheckCheck className="h-3 w-3" /> Messages are private to you, the customer and MeCart support.</p>
      </div>
    </div>
  );
}
