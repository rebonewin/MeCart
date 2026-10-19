"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSecurityEvent } from "@/lib/security/audit";
import {
  adminResetTwoFactor,
  adminUnlockTwoFactor,
  beginContactMethodSetup,
  confirmContactMethodSetup,
  confirmTotpSetup,
  disableTwoFactor,
  regenerateRecoveryCodes,
  revokeAllTrustedDevices,
  revokeTrustedDevice,
  sendChallengeEmailCode,
  sendChallengeSmsCode,
  startTotpSetup,
  verifyTwoFactorChallenge,
  type TwoFactorVerifyResult,
} from "@/lib/services/two-factor-service";

const codeSchema = z.string().trim().min(4).max(32);
const passwordSchema = z.string().min(1).max(200);

/**
 * Called by /reset-password after a recovery link/code establishes a session.
 * Recovery sessions must never outlive the reset itself for 2FA accounts: the
 * session is revoked server-side and the page shows a blocked state.
 */
export async function guardRecoverySession(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Your reset session has ended. Please request a new link." };
    }

    let enabled = true;
    let admin: ReturnType<typeof createAdminClient> | null = null;

    try {
      admin = createAdminClient();
      const { data } = await admin
        .from("user_two_factor")
        .select("enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      enabled = Boolean(data?.enabled);
    } catch {
      enabled = true;
    }

    if (!enabled) return { ok: true };

    try {
      if (admin) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          try {
            await admin.auth.admin.signOut(session.access_token, "local");
          } catch {
            // Cookie removal below still applies.
          }
        }
      }
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Best effort — the caller is still blocked below.
    }

    await logSecurityEvent({
      action: "PASSWORD_RESET_SESSION_BLOCKED_2FA",
      userId: user.id,
      status: "FAILED",
    });

    return {
      ok: false,
      error:
        "Two-factor authentication is enabled for this account, so a reset link alone cannot change the password. Sign in with your password and a recovery code, or contact an administrator.",
    };
  } catch {
    return { ok: false, error: "We couldn't verify this reset session. Please request a new link." };
  }
}

export async function verifyTwoFactorLogin(input: {
  method: "totp" | "email" | "sms" | "recovery";
  code: string;
  rememberDevice?: boolean;
}): Promise<TwoFactorVerifyResult> {
  const parsed = z
    .object({
      method: z.enum(["totp", "email", "sms", "recovery"]),
      code: codeSchema,
      rememberDevice: z.boolean().optional(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Enter a valid verification code.",
      remainingAttempts: 5,
      locked: false,
    };
  }

  try {
    return await verifyTwoFactorChallenge(parsed.data);
  } catch {
    return {
      ok: false,
      error: "We couldn't verify that code right now. Please try again.",
      remainingAttempts: 5,
      locked: false,
    };
  }
}

export async function requestEmailTwoFactorCode() {
  try {
    return await sendChallengeEmailCode();
  } catch {
    return { ok: false as const, error: "We couldn't send the email code right now." };
  }
}

export async function requestSmsTwoFactorCode() {
  try {
    return await sendChallengeSmsCode();
  } catch {
    return { ok: false as const, error: "We couldn't send the SMS code right now." };
  }
}

export async function startAuthenticatorSetup(password: string) {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { ok: false as const, error: "Enter your password." };

  try {
    return await startTotpSetup(parsed.data);
  } catch {
    return { ok: false as const, error: "Could not start authenticator setup. Please try again." };
  }
}

export async function confirmAuthenticatorSetup(code: string) {
  const parsed = codeSchema.safeParse(code);
  if (!parsed.success) return { ok: false as const, error: "Enter the 6-digit code." };

  try {
    const result = await confirmTotpSetup(parsed.data);
    if (result.ok) revalidatePath("/profile/security");
    return result;
  } catch {
    return { ok: false as const, error: "Could not confirm authenticator setup. Please try again." };
  }
}

export async function startEmailTwoFactorSetup(password: string) {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { ok: false as const, error: "Enter your password." };

  try {
    return await beginContactMethodSetup({ method: "email", password: parsed.data });
  } catch {
    return { ok: false as const, error: "Could not send the email code. Please try again." };
  }
}

export async function startSmsTwoFactorSetup(password: string) {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { ok: false as const, error: "Enter your password." };

  try {
    return await beginContactMethodSetup({ method: "sms", password: parsed.data });
  } catch {
    return { ok: false as const, error: "Could not send the SMS code. Please try again." };
  }
}

export async function confirmContactTwoFactorSetup(code: string) {
  const parsed = codeSchema.safeParse(code);
  if (!parsed.success) return { ok: false as const, error: "Enter the 6-digit code." };

  try {
    const result = await confirmContactMethodSetup(parsed.data);
    if (result.ok) revalidatePath("/profile/security");
    return result;
  } catch {
    return { ok: false as const, error: "Could not confirm that method. Please try again." };
  }
}

export async function disableTwoFactorAction(input: { password: string; code: string }) {
  const parsed = z
    .object({ password: passwordSchema, code: codeSchema })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter your password and current code." };

  try {
    const result = await disableTwoFactor(parsed.data);
    if (result.ok) revalidatePath("/profile/security");
    return result;
  } catch {
    return { ok: false as const, error: "Could not disable two-factor authentication. Please try again." };
  }
}

export async function regenerateRecoveryCodesAction(input: { password: string; code: string }) {
  const parsed = z
    .object({ password: passwordSchema, code: codeSchema })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter your password and current code." };

  try {
    const result = await regenerateRecoveryCodes(parsed.data);
    if (result.ok) revalidatePath("/profile/security");
    return result;
  } catch {
    return { ok: false as const, error: "Could not regenerate recovery codes. Please try again." };
  }
}

export async function removeTrustedDevice(deviceId: string) {
  const parsed = z.string().uuid().safeParse(deviceId);
  if (!parsed.success) return { ok: false as const, error: "Invalid device." };

  try {
    return await revokeTrustedDevice(parsed.data);
  } catch {
    return { ok: false as const, error: "Could not remove that device. Please try again." };
  }
}

export async function removeAllTrustedDevices() {
  try {
    return await revokeAllTrustedDevices();
  } catch {
    return { ok: false as const, error: "Could not revoke trusted devices. Please try again." };
  }
}

export async function unlockTwoFactorUser(userId: string) {
  const staff = await requireStaff();
  const parsed = z.string().uuid().safeParse(userId);
  if (!parsed.success) return { ok: false as const, error: "Invalid user." };

  try {
    const result = await adminUnlockTwoFactor(parsed.data, staff.id);
    if (result.ok) revalidatePath("/admin/security/two-factor");
    return result;
  } catch {
    return { ok: false as const, error: "Could not unlock that user." };
  }
}

export async function resetTwoFactorUser(userId: string) {
  const staff = await requireStaff();
  const parsed = z.string().uuid().safeParse(userId);
  if (!parsed.success) return { ok: false as const, error: "Invalid user." };

  try {
    const result = await adminResetTwoFactor(parsed.data, staff.id);
    if (result.ok) revalidatePath("/admin/security/two-factor");
    return result;
  } catch {
    return { ok: false as const, error: "Could not reset two-factor authentication." };
  }
}
