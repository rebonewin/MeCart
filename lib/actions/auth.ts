"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/security/audit";

const registerSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3).max(36).regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores"),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginResult =
  | { ok: true; redirectTo: string; role: string }
  | { ok: false; error: string };

/** Resolve a username (or email) to the account email. Server-side only. */
async function resolveLoginEmail(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) return identifier;
  if (!hasAdminCredentials()) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("email")
    .ilike("username", identifier)
    .is("deleted_at", null)
    .maybeSingle();

  return data?.email ?? null;
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

type SignupAvailability = { username_taken: boolean; email_taken: boolean };

/**
 * Pre-flight check for taken usernames/emails via a SECURITY DEFINER RPC so it
 * works without service-role credentials. Without it a duplicate username would
 * reach the signup trigger and surface as "Database error saving new user".
 */
async function fetchSignupAvailability(
  supabase: ServerSupabase,
  username: string,
  email: string,
): Promise<SignupAvailability | null> {
  try {
    const { data, error } = await supabase.rpc("check_signup_available", {
      p_username: username,
      p_email: email,
    });
    if (error || !data) return null;
    return data as SignupAvailability;
  } catch {
    return null;
  }
}

export async function login(input: {
  username: string;
  password: string;
  callbackUrl?: string | null;
}): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a username and password" };

  const identifier = parsed.data.username.trim();
  const email = await resolveLoginEmail(identifier);
  if (!email) return { ok: false, error: "Invalid username or password" };

  const supabase = await createClient();

  // Remember the anonymous guest session (if any) so its cart and wishlist can
  // be folded into the account that is about to sign in.
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();
  const guestId = sessionUser?.is_anonymous ? sessionUser.id : null;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    await logActivity({ action: "LOGIN_FAILED", resource: `user:${identifier}` });
    if (error?.message.toLowerCase().includes("email not confirmed")) {
      return { ok: false, error: "Please verify your email address first — check your inbox." };
    }
    return { ok: false, error: "Invalid username or password" };
  }

  if (guestId && guestId !== data.user.id) {
    try {
      await supabase.rpc("merge_guest_cart", { p_from_user: guestId });
    } catch {
      // Best-effort merge; signing in must never fail because of it.
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", data.user.id)
    .maybeSingle();

  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);

  await logActivity({
    action: "LOGIN",
    resource: `user:${profile?.username ?? identifier}`,
    userId: data.user.id,
  });

  revalidatePath("/", "layout");

  const role = profile?.role ?? "customer";
  const fallback = role === "admin" || role === "manager" ? "/admin/dashboard" : "/";
  const callbackUrl = input.callbackUrl;
  const redirectTo =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : fallback;

  return { ok: true, redirectTo, role };
}

export type RegisterResult =
  | { ok: true; message: string; needsEmailConfirmation: boolean }
  | { ok: false; error: string };

export async function registerCustomer(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Invalid registration data";
    return { ok: false, error: issue };
  }
  const v = parsed.data;

  const supabase = await createClient();

  // Friendly duplicate detection before signUp (works with anon credentials).
  const availability = await fetchSignupAvailability(supabase, v.username, v.email);
  if (availability?.username_taken) return { ok: false, error: "Username already taken" };
  if (availability?.email_taken) return { ok: false, error: "Email already registered" };

  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      data: { username: v.username, name: v.name },
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("database error")) {
      // Rare race or trigger-side conflict: re-check to translate the raw error.
      const recheck = await fetchSignupAvailability(supabase, v.username, v.email);
      if (recheck?.username_taken) return { ok: false, error: "Username already taken" };
      if (recheck?.email_taken) return { ok: false, error: "Email already registered" };
      return { ok: false, error: "We couldn't create your account right now. Please try again." };
    }
    if (message.includes("already registered")) {
      return { ok: false, error: "Email already registered" };
    }
    return { ok: false, error: error.message };
  }

  if (data.user) {
    await logActivity({
      action: "REGISTER",
      resource: `user:${v.username}`,
      userId: data.user.id,
      metadata: { username: v.username, email: v.email },
    });
  }

  revalidatePath("/login");

  const needsEmailConfirmation = !data.session;
  return {
    ok: true,
    needsEmailConfirmation,
    message: needsEmailConfirmation
      ? "Account created. Check your email to verify your address, then sign in."
      : "Account created. You can sign in now.",
  };
}

export async function updateProfile(input: { name?: string; email?: string; phone?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("profiles")
    .update({
      full_name: input.name ?? null,
      email: input.email ?? user.email ?? null,
      phone: input.phone ?? null,
    })
    .eq("id", user.id);

  if (input.name) {
    await supabase.auth.updateUser({ data: { name: input.name } });
  }

  await logActivity({ action: "PROFILE_UPDATE", resource: `user:${user.id}`, userId: user.id });
  revalidatePath("/profile");
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Unauthorized");

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  });
  if (verifyError) throw new Error("Current password is incorrect");

  if (input.newPassword.length < 8) throw new Error("New password must be at least 8 characters");

  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) throw new Error(error.message);

  await logActivity({ action: "PASSWORD_CHANGE", resource: `user:${user.id}`, userId: user.id });
}

export async function requestPasswordReset(input: { email: string }) {
  const parsed = z.string().email().safeParse(input.email);
  if (!parsed.success) throw new Error("Enter a valid email address");

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
  return "If an account exists for that email, a reset link has been sent.";
}

export async function updatePassword(input: { newPassword: string }) {
  if (input.newPassword.length < 8) throw new Error("Password must be at least 8 characters");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) throw new Error(error.message);
}

export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await logActivity({ action: "LOGOUT", resource: `user:${user.id}`, userId: user.id });
  }
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
