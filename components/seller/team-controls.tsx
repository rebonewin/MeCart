"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { inviteVendorMember, removeVendorMember, updateVendorMemberRole } from "@/lib/actions/vendor";
import type { VendorMemberRole } from "@/types/database";

const field = "h-9 rounded-xl border border-white/10 bg-[#07090f] px-3 text-xs text-white outline-none focus:border-[#d8b45a]/40";

export function SellerTeamControls({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ email: string; role: Exclude<VendorMemberRole, "OWNER"> }>({ email: "", role: "MANAGER" });

  const invite = () => startTransition(async () => {
    try {
      await inviteVendorMember(form);
      toast.success("Team member added.");
      setOpen(false);
      setForm({ email: "", role: "MANAGER" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add team member");
    }
  });

  if (!canManage) return null;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#d8b45a] px-4 text-[11px] font-semibold text-[#1e1708]">
        <UserPlus className="h-3 w-3" /> Add member
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#d8b45a]/20 bg-[#d8b45a]/[0.05] p-3">
      <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Existing MeCart email" className={`${field} w-52`} />
      <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Exclude<VendorMemberRole, "OWNER"> }))} className={field}>
        <option value="ADMIN">Admin</option>
        <option value="MANAGER">Manager</option>
        <option value="ANALYST">Analyst</option>
        <option value="SUPPORT">Support</option>
      </select>
      <button type="button" onClick={invite} disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#d8b45a] px-4 text-[11px] font-semibold text-[#1e1708] disabled:opacity-55">
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />} Invite
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-[11px] text-slate-400 hover:text-white">Cancel</button>
    </div>
  );
}

export function SellerTeamRowActions({
  memberId,
  role,
  isSelf,
  canManage,
}: {
  memberId: string;
  role: string;
  isSelf: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (!canManage) return null;

  const update = (next: string) => startTransition(async () => {
    try {
      await updateVendorMemberRole(memberId, next as "OWNER" | "ADMIN" | "MANAGER" | "ANALYST" | "SUPPORT");
      toast.success("Role updated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update role");
    }
  });

  const remove = () => startTransition(async () => {
    try {
      await removeVendorMember(memberId);
      toast.success("Team member removed.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove member");
    }
  });

  return (
    <div className="flex items-center justify-end gap-1.5">
      <select value={role} onChange={(event) => update(event.target.value)} disabled={pending || isSelf} className="h-8 rounded-lg border border-white/10 bg-[#07090f] px-2 text-[10px] text-slate-300 disabled:opacity-50">
        <option value="OWNER">Owner</option>
        <option value="ADMIN">Admin</option>
        <option value="MANAGER">Manager</option>
        <option value="ANALYST">Analyst</option>
        <option value="SUPPORT">Support</option>
      </select>
      {!isSelf && (
        <button type="button" onClick={remove} disabled={pending} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-500 hover:border-rose-400/30 hover:text-rose-300 disabled:opacity-40" aria-label="Remove member">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}
