import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Breadcrumbs, EmptyState, PageHeader } from "@/components/shop/storefront-ui";
import { CustomerConversation } from "@/components/marketplace/customer-conversation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateTimeLabel } from "@/lib/marketplace/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages | MeCart" };

export default async function CustomerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");
  const params = await searchParams;
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("vendor_conversations")
    .select("*")
    .eq("customer_id", user.id)
    .order("last_message_at", { ascending: false });
  const rows = conversations ?? [];
  const conversationIds = rows.map((conversation) => conversation.id);
  const storeIds = [...new Set(rows.map((conversation) => conversation.store_id).filter((id): id is string => Boolean(id)))];
  const vendorIds = [...new Set(rows.map((conversation) => conversation.vendor_id))];

  const [messagesRes, storesRes, vendorsRes] = await Promise.all([
    conversationIds.length
      ? supabase.from("vendor_messages").select("*").in("conversation_id", conversationIds).order("created_at")
      : Promise.resolve({ data: [] as { id: string; conversation_id: string; sender_id: string | null; sender_type: string; body: string; attachments: string[]; read_at: string | null; created_at: string }[] }),
    storeIds.length
      ? supabase.from("stores").select("id, name").in("id", storeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    vendorIds.length
      ? supabase.from("public_vendor_profiles").select("id, display_name").in("id", vendorIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
  ]);

  const messages = messagesRes.data ?? [];
  const storeMap = new Map((storesRes.data ?? []).map((store) => [store.id, store.name]));
  const vendorMap = new Map((vendorsRes.data ?? []).map((vendor) => [vendor.id, vendor.display_name]));
  const selected = rows.find((conversation) => conversation.id === params.c) ?? rows[0];
  const selectedMessages = selected ? messages.filter((message) => message.conversation_id === selected.id) : [];
  const nameFor = (conversation: typeof rows[number]) =>
    (conversation.store_id ? storeMap.get(conversation.store_id) : null) ?? vendorMap.get(conversation.vendor_id) ?? "Marketplace seller";
  const unreadFor = (conversationId: string) =>
    messages.filter((message) => message.conversation_id === conversationId && message.sender_type !== "CUSTOMER" && !message.read_at).length;

  return (
    <div className="lx-page">
      <div className="lx-container py-10 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Messages" }]} className="mb-8" />
        <PageHeader
          eyebrow="Private correspondence"
          title={<>Your <span className="lx-serif text-[var(--lx-gold)]">messages</span></>}
          description="Conversations with marketplace sellers and MeCart support. Order-specific threads stay attached to your account."
        />

        {rows.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={MessageSquare}
              eyebrow="No conversations"
              title="Your inbox is quiet"
              description="Start a conversation from any store page, or contact a seller about an order."
            >
              <Link href="/stores" className="inline-flex h-11 items-center rounded-full bg-[var(--lx-text)] px-6 text-sm font-semibold text-[var(--lx-bg)]">Browse stores</Link>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-9 grid gap-5 xl:grid-cols-[340px_1fr]">
            <div className="lx-card overflow-hidden rounded-2xl p-0">
              <div className="border-b border-[var(--lx-border)] px-4 py-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--lx-muted)]">Inbox · {rows.length}</p>
              </div>
              <div className="max-h-[620px] divide-y divide-[var(--lx-border)] overflow-y-auto">
                {rows.map((conversation) => {
                  const active = selected?.id === conversation.id;
                  const unread = unreadFor(conversation.id);
                  return (
                    <Link key={conversation.id} href={`/messages?c=${conversation.id}`} className={`block px-4 py-3.5 transition ${active ? "bg-[var(--lx-gold)]/[0.08]" : "hover:bg-white/[0.03]"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--lx-text)]">{conversation.subject}</p>
                          <p className="mt-0.5 truncate text-[11px] text-[var(--lx-muted)]">{nameFor(conversation)} · {conversation.last_message_preview || "No preview"}</p>
                        </div>
                        {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--lx-gold)] px-1 text-[9px] font-bold text-[#1e1708]">{unread}</span>}
                      </div>
                      <p className="mt-2 text-[9px] text-[var(--lx-faint)]">{dateTimeLabel(conversation.last_message_at)}</p>
                    </Link>
                  );
                })}
              </div>
            </div>

            {selected ? (
              <div className="lx-card overflow-hidden rounded-2xl p-0">
                <CustomerConversation
                  conversationId={selected.id}
                  subject={selected.subject}
                  storeName={nameFor(selected)}
                  status={selected.status}
                  messages={selectedMessages.map((message) => ({
                    id: message.id,
                    body: message.body,
                    sender_type: message.sender_type,
                    created_at: message.created_at,
                    read_at: message.read_at,
                  }))}
                />
              </div>
            ) : (
              <div className="lx-card flex items-center justify-center rounded-2xl p-10 text-sm text-[var(--lx-muted)]">
                <MessageSquare className="mr-2 h-4 w-4" /> Select a conversation
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
