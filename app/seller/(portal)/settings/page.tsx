import Link from "next/link";
import { BadgeCheck, KeyRound, ShieldCheck, Store, Users } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { createClient } from "@/lib/supabase/server";
import { listSellerStores } from "@/lib/repositories/seller";
import { vendorPermissionList, VENDOR_PERMISSIONS } from "@/lib/marketplace/permissions";
import { dateLabel } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerPageHeader } from "@/components/seller/ui";
import { VendorSettingsForm } from "@/components/seller/vendor-settings-form";
import { SellerTeamControls, SellerTeamRowActions } from "@/components/seller/team-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings | MeCart Seller" };

export default async function SellerSettingsPage() {
  const context = await requireSellerContext(VENDOR_PERMISSIONS.settingsManage);
  const supabase = await createClient();
  const [membersRes, verificationRes, stores] = await Promise.all([
    supabase
      .from("vendor_members")
      .select("*")
      .eq("vendor_id", context.vendor.id)
      .neq("status", "REMOVED")
      .order("created_at"),
    supabase
      .from("vendor_verifications")
      .select("*")
      .eq("vendor_id", context.vendor.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    listSellerStores(context.vendor.id),
  ]);

  const members = membersRes.data ?? [];
  const profileIds = members.map((member) => member.user_id);
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", profileIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const canManageTeam = context.can(VENDOR_PERMISSIONS.membersManage);
  const permissions = vendorPermissionList(context.membership.role, context.membership.permissions);

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Account"
        title="Settings"
        description="Vendor identity, team access and the verification record behind your marketplace account."
      />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <SellerCard>
          <h3 className="text-sm font-semibold text-white">Vendor profile</h3>
          <p className="mt-1 text-xs text-slate-500">Shown on your public vendor page and storefronts.</p>
          <div className="mt-5">
            <VendorSettingsForm vendor={context.vendor} />
          </div>
        </SellerCard>

        <div className="space-y-5">
          <SellerCard>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-semibold text-white">Verification</h3>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between"><span className="text-slate-500">Account status</span><SellerBadge tone={context.vendor.status === "APPROVED" ? "success" : context.vendor.status === "REJECTED" ? "danger" : "warning"}>{context.vendor.status.replaceAll("_", " ")}</SellerBadge></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Verification</span><SellerBadge tone={context.vendor.verification_status === "VERIFIED" ? "success" : "warning"}>{context.vendor.verification_status}</SellerBadge></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Commission</span><span className="font-semibold text-[#E6C768]">{context.vendor.commission_rate}%</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Payout cycle</span><span className="text-slate-300">{context.vendor.payout_cycle}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Member since</span><span className="text-slate-300">{dateLabel(context.vendor.created_at)}</span></div>
            </div>
            {verificationRes.data?.notes && (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-[11px] leading-5 text-amber-200">
                {verificationRes.data.notes}
              </div>
            )}
          </SellerCard>

          <SellerCard>
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-semibold text-white">Stores</h3>
            </div>
            <div className="mt-3 space-y-2">
              {stores.length ? stores.map((store) => (
                <Link key={store.id} href={`/seller/stores/${store.id}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs hover:border-[#D4AF37]/25">
                  <span className="text-slate-300">{store.name}</span>
                  <SellerBadge tone={store.status === "ACTIVE" ? "success" : "warning"}>{store.status}</SellerBadge>
                </Link>
              )) : <p className="text-xs text-slate-500">No stores yet.</p>}
            </div>
          </SellerCard>

          <SellerCard>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-semibold text-white">Your permissions</h3>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Role: {context.membership.role}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {permissions.map((permission) => <span key={permission} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-slate-400">{permission}</span>)}
            </div>
          </SellerCard>
        </div>
      </div>

      <SellerCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="text-sm font-semibold text-white">Team</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">Granular permissions are enforced by role at the database and action layers.</p>
          </div>
          <SellerTeamControls canManage={canManageTeam} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="border-b border-white/[0.07] text-[9px] uppercase tracking-[0.16em] text-slate-600">
              <tr>
                <th className="py-2.5 font-medium">Member</th>
                <th className="py-2.5 font-medium">Status</th>
                <th className="py-2.5 font-medium">Joined</th>
                <th className="py-2.5 text-right font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const profile = profileMap.get(member.user_id);
                return (
                  <tr key={member.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[10px] font-semibold text-[#E6C768]">
                          {(profile?.full_name || profile?.email || "?").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-slate-200">{profile?.full_name || "Team member"}{member.id === context.membership.id ? " (you)" : ""}</p>
                          <p className="text-[10px] text-slate-600">{profile?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><SellerBadge tone={member.status === "ACTIVE" ? "success" : "neutral"}>{member.status}</SellerBadge></td>
                    <td className="py-3 text-slate-500">{dateLabel(member.joined_at || member.created_at)}</td>
                    <td className="py-3">
                      <div className="flex justify-end">
                        <SellerTeamRowActions memberId={member.id} role={member.role} isSelf={member.id === context.membership.id} canManage={canManageTeam} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SellerCard>

      <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] text-slate-500">
        <BadgeCheck className="h-4 w-4 text-emerald-300" />
        Sensitive marketplace changes are recorded in an append-only vendor audit log.
      </div>
    </div>
  );
}
