import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { listPhoneVerificationUsers } from "@/lib/services/phone-otp-service";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** GET /api/admin/phone-verification/export — staff CSV export. */
export async function GET() {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rows = await listPhoneVerificationUsers();

  const header = [
    "Status",
    "Full Name",
    "Username",
    "Email",
    "Phone",
    "Country",
    "Verified At",
    "Last OTP",
    "Last Phone Login",
    "OTP Attempts",
    "Failed Attempts",
    "Blocked Until",
    "Provider",
    "Created",
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.status,
        row.full_name,
        row.username,
        row.email,
        row.phone_number,
        row.country_code,
        row.phone_verified_at,
        row.last_otp_sent_at,
        row.last_phone_login,
        row.otp_attempts,
        row.failed_attempts,
        row.blocked_until,
        row.verification_provider,
        row.created_at,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`\uFEFF${lines.join("\n")}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="phone-verification-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
