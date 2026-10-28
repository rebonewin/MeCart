import { NextResponse } from "next/server";
import { getAssistantCatalog } from "@/lib/ai/server/catalog";
import { isAiConfigured } from "@/lib/ai/server/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, cached catalogue snapshot for MECO.
 *
 * Keeping this on the server avoids shipping storefront queries into the chat
 * bundle, lets the chat route reuse the same snapshot, and gives the client a
 * single place to learn whether hosted AI is configured.
 */
export async function GET() {
  try {
    const catalog = await getAssistantCatalog();
    return NextResponse.json(
      {
        ...catalog,
        aiConfigured: isAiConfigured(),
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            process.env.NODE_ENV === "development"
              ? "no-store"
              : "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "The catalogue is unavailable right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
