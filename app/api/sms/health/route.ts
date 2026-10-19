import { NextResponse } from "next/server";
import { checkSmsHealth, getSmsSetupStatus } from "@/lib/sms";

export const dynamic = "force-dynamic";

/** GET /api/sms/health — provider setup + reachability (no secrets exposed). */
export async function GET() {
  const status = getSmsSetupStatus();

  if (!status.configured) {
    return NextResponse.json({
      ok: false,
      provider: status.provider,
      configured: false,
      missing: status.missing,
      detail: `SMS provider "${status.provider}" is not configured. Missing: ${status.missing.join(", ")}.`,
    });
  }

  const health = await checkSmsHealth();
  return NextResponse.json(
    {
      ok: health.ok,
      provider: health.provider,
      configured: health.configured,
      missing: [],
      detail: health.detail,
    },
    { status: health.ok ? 200 : 503 },
  );
}
