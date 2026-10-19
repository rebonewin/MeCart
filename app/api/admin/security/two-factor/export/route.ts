import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth";
import { getAdminTwoFactorData } from "@/lib/services/two-factor-service";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** GET /api/admin/security/two-factor/export — staff-only CSV export. */
export async function GET() {
  try {
    await requireStaff();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { rows } = await getAdminTwoFactorData();

  const header = [
    "user_id",
    "name",
    "username",
    "email",
    "phone",
    "role",
    "two_factor_enabled",
    "method",
    "enabled_at",
    "last_used_at",
    "failed_attempts",
    "locked_until",
    "recovery_remaining",
    "recovery_used",
    "status",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.userId,
        row.name,
        row.username,
        row.email,
        row.phone,
        row.role,
        row.enabled ? "yes" : "no",
        row.method,
        row.enabledAt,
        row.lastUsedAt,
        row.failedAttempts,
        row.lockedUntil,
        row.recoveryRemaining,
        row.recoveryUsed,
        row.status,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  const filename = `mecart-two-factor-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`\uFEFF${lines.join("\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
