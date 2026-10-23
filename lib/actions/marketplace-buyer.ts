"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const MAX_BODY = 8000;

function cleanMessage(value: string) {
  const body = value.trim();
  if (body.length < 2) throw new Error("Write a short message first");
  if (body.length > MAX_BODY) throw new Error("Message is too long");
  return body;
}

export async function startStoreConversation(input: {
  storeId: string;
  subject: string;
  body: string;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const subject = input.subject.trim().slice(0, 160) || "Store enquiry";
  const body = cleanMessage(input.body);

  const { data: store } = await supabase
    .from("stores")
    .select("id, vendor_id, name, status")
    .eq("id", input.storeId)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (!store) throw new Error("Store is not available");

  const { data: conversation, error } = await supabase
    .from("vendor_conversations")
    .insert({
      vendor_id: store.vendor_id,
      store_id: store.id,
      customer_id: user.id,
      subject,
      status: "OPEN",
      last_message_preview: body.slice(0, 180),
    })
    .select("id")
    .single();
  if (error || !conversation) throw new Error(error?.message ?? "Could not start conversation");

  const { error: messageError } = await supabase.from("vendor_messages").insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    sender_type: "CUSTOMER",
    body,
  });
  if (messageError) throw new Error(messageError.message);

  try {
    const admin = createAdminClient();
    await admin.from("vendor_notifications").insert({
      vendor_id: store.vendor_id,
      type: "MESSAGE",
      title: "New customer message",
      body: `${user.name ?? "A customer"} started “${subject}” at ${store.name}.`,
      link: "/seller/messages",
      data: { conversation_id: conversation.id, store_id: store.id } as Json,
    });
  } catch {
    // Notification delivery is best-effort; the conversation itself is saved.
  }

  revalidatePath("/messages");
  revalidatePath("/seller/messages");
  return { conversationId: conversation.id as string };
}

export async function sendCustomerMessage(conversationId: string, body: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const message = cleanMessage(body);

  const { data: conversation } = await supabase
    .from("vendor_conversations")
    .select("id, customer_id")
    .eq("id", conversationId)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!conversation) throw new Error("Conversation not found");

  const { error } = await supabase.from("vendor_messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    sender_type: "CUSTOMER",
    body: message,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/messages");
  return { ok: true };
}

export async function markCustomerMessagesRead(conversationId: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendor_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .in("sender_type", ["VENDOR", "STAFF"])
    .is("read_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/messages");
  return { ok: true };
}

export async function toggleFollowStore(storeId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("store_followers")
    .select("id")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("store_followers").delete().eq("id", existing.id);
    if (error) throw new Error(error.message);
    revalidatePath("/stores");
    return { following: false };
  }

  const { error } = await supabase
    .from("store_followers")
    .insert({ store_id: storeId, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/stores");
  return { following: true };
}
