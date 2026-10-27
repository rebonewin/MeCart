"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markSellerNotificationRead } from "@/lib/actions/seller-operations";

export function NotificationReadButton({ id, read }: { id: string; read: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (read) return null;

  const mark = () => startTransition(async () => {
    try {
      await markSellerNotificationRead(id);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not mark read");
    }
  });

  return (
    <Button type="button" onClick={mark} disabled={pending} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 px-3 text-[10px] text-slate-400 transition hover:border-[#D4AF37]/30 hover:text-white disabled:opacity-50">
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Mark read
    </Button>
  );
}
