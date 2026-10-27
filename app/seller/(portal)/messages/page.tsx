import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerConversations } from "@/lib/repositories/seller";
import { dateTimeLabel } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerEmpty, SellerPageHeader, sellerStatusTone } from "@/components/seller/ui";
import { SellerConversation } from "@/components/seller/conversation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages | MeCart Seller" };

export default async function SellerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const params = await searchParams;
  const context = await requireSellerContext();
  const conversations = await listSellerConversations(context.vendor.id);
  const selected = conversations.find((conversation) => conversation.id === params.c) ?? conversations[0];

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Customer care"
        title="Messages"
        description="Buyer and support conversations concerning your orders or store. Response history is retained for both sides."
      />

      {conversations.length === 0 ? (
        <SellerEmpty title="No conversations yet" description="Customers can start a conversation from a product page or order. Messages arrive here." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <SellerCard className="overflow-hidden p-0">
            <div className="border-b border-white/[0.07] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Inbox · {conversations.length}</p>
            </div>
            <div className="max-h-[640px] divide-y divide-white/[0.05] overflow-y-auto">
              {conversations.map((conversation) => {
                const active = selected?.id === conversation.id;
                return (
                  <Link key={conversation.id} href={`/seller/messages?c=${conversation.id}`} className={`block px-4 py-3.5 transition ${active ? "bg-[#D4AF37]/[0.08]" : "hover:bg-white/[0.03]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{conversation.subject}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{conversation.customerName} · {conversation.last_message_preview || "No preview"}</p>
                      </div>
                      {conversation.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[9px] font-bold text-[#0B0B0F]">{conversation.unread}</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <SellerBadge tone={sellerStatusTone(conversation.status)}>{conversation.status}</SellerBadge>
                      <span className="text-[9px] text-slate-600">{dateTimeLabel(conversation.last_message_at)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SellerCard>

          {selected ? (
            <SellerCard className="overflow-hidden p-0">
              <SellerConversation
                conversationId={selected.id}
                subject={selected.subject}
                customerName={selected.customerName}
                customerEmail={selected.customerEmail}
                status={selected.status}
                messages={selected.messages.map((message) => ({
                  id: message.id,
                  body: message.body,
                  sender_type: message.sender_type,
                  created_at: message.created_at,
                  read_at: message.read_at,
                }))}
              />
            </SellerCard>
          ) : (
            <SellerCard className="flex items-center justify-center p-10 text-sm text-slate-500">
              <MessageSquare className="mr-2 h-4 w-4" /> Select a conversation
            </SellerCard>
          )}
        </div>
      )}
    </div>
  );
}
