import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { answerMeco } from "@/lib/ai/assistant";
import {
  categorySuggestions,
  dedupeProducts,
  matchProducts,
  mentionedProducts,
  topProducts,
  firstName,
} from "@/lib/ai/search";
import type {
  AiChatErrorCode,
  AiChatStreamEvent,
  AssistantCatalog,
  AssistantContext,
  AssistantReply,
} from "@/lib/ai/types";
import { getAssistantCatalog } from "@/lib/ai/server/catalog";
import { loadCommerceContext } from "@/lib/ai/server/commerce-context";
import {
  AiNotConfiguredError,
  AiProviderError,
  createChatCompletionStream,
  getAiConfig,
  isAiConfigured,
} from "@/lib/ai/server/provider";
import { buildAiMessages } from "@/lib/ai/server/prompt";
import {
  clientIp,
  consumeRateLimit,
  getRateLimitConfig,
  hashRateKey,
} from "@/lib/ai/server/rate-limit";
import {
  MAX_BODY_BYTES,
  validateChatBody,
} from "@/lib/ai/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

function jsonError(
  message: string,
  code: AiChatErrorCode,
  status: number,
  retryAfterSeconds?: number,
) {
  const headers = new Headers(NO_STORE_HEADERS);
  if (retryAfterSeconds) {
    headers.set("Retry-After", String(retryAfterSeconds));
  }
  return NextResponse.json(
    {
      error: message,
      code,
      ...(retryAfterSeconds ? { retryAfter: retryAfterSeconds } : {}),
    },
    { status, headers },
  );
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = new URL(request.url).host;
    const headerHost = request.headers.get("host");
    return originHost === requestHost || originHost === headerHost;
  } catch {
    return false;
  }
}

function selectReplyProducts(input: {
  text: string;
  latestUserMessage: string;
  local: AssistantReply;
  catalog: AssistantCatalog | null;
  cartCount: number;
}) {
  const { catalog, local, latestUserMessage, text, cartCount } = input;
  if (!catalog) return undefined;

  const mentioned = mentionedProducts(text, catalog, 4);
  if (mentioned.length) return mentioned;

  const wantsCards =
    local.intent === "recommend" ||
    local.intent === "gift" ||
    local.intent === "search" ||
    ((local.intent === "cart" || local.intent === "checkout") && cartCount === 0);

  if (!wantsCards) return undefined;

  const saysNoMatch =
    /\b(don't have|couldn't find|could not find|not in (the )?catalogue|no (matching|exact) (piece|product))\b/i.test(
      text,
    );
  if (saysNoMatch) return undefined;

  const searched = matchProducts(latestUserMessage, catalog, { limit: 4 });
  const picks = dedupeProducts([
    ...(local.products ?? []),
    ...searched,
    ...topProducts(catalog, 4),
  ]).slice(0, 4);

  return picks.length ? picks : undefined;
}

function rateLimitMessage(retryAfter: number) {
  const minutes = Math.max(1, Math.ceil(retryAfter / 60));
  return `MECO is handling a lot of conversations right now. Please try again in about ${minutes} ${
    minutes === 1 ? "minute" : "minutes"
  }.`;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(
      "This request could not be verified.",
      "INVALID_REQUEST",
      403,
    );
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return jsonError(
      "Send the conversation as JSON.",
      "INVALID_REQUEST",
      415,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonError("That request is too large.", "INVALID_REQUEST", 413);
  }

  const rateConfig = getRateLimitConfig();
  const ipKey = `ip:${hashRateKey(clientIp(request))}`;
  const ipLimit = consumeRateLimit(
    ipKey,
    rateConfig.ipLimit,
    rateConfig.windowMs,
  );
  if (!ipLimit.allowed) {
    return jsonError(
      rateLimitMessage(ipLimit.retryAfterSeconds),
      "RATE_LIMITED",
      429,
      ipLimit.retryAfterSeconds,
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonError(
      "The conversation could not be read.",
      "INVALID_REQUEST",
      400,
    );
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return jsonError("That request is too large.", "INVALID_REQUEST", 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonError("Send the conversation as JSON.", "INVALID_REQUEST", 400);
  }

  const validation = validateChatBody(body);
  if (!validation.ok) {
    return jsonError(validation.message, "INVALID_REQUEST", 422);
  }

  const user = await getCurrentUser().catch(() => null);
  if (user) {
    const userLimit = consumeRateLimit(
      `user:${user.id}`,
      rateConfig.userLimit,
      rateConfig.windowMs,
    );
    if (!userLimit.allowed) {
      return jsonError(
        rateLimitMessage(userLimit.retryAfterSeconds),
        "RATE_LIMITED",
        429,
        userLimit.retryAfterSeconds,
      );
    }
  }

  if (!isAiConfigured()) {
    return jsonError(
      "MECO is running in atelier mode right now. I can still help with products, your bag, delivery and orders.",
      "AI_NOT_CONFIGURED",
      503,
    );
  }

  const { messages, context, latestUserMessage } = validation.data;

  const [catalog, commerce] = await Promise.all([
    getAssistantCatalog().catch(() => null),
    loadCommerceContext(user?.id),
  ]);

  const assistantContext: AssistantContext = {
    name: user?.name ?? context.name ?? null,
    cartCount: context.cartCount,
    cartSubtotal: context.cartSubtotal,
    cartItems: context.cartItems,
    wishlistCount: context.wishlistCount,
    wishlistItems: context.wishlistItems,
    recentlyViewed: context.recentlyViewed,
    pathname: context.pathname,
  };

  const localReply = answerMeco(latestUserMessage, assistantContext, catalog);
  const promptMessages = buildAiMessages({
    messages,
    context,
    catalog,
    latestUserMessage,
    signedIn: Boolean(user),
    name: user?.name ? firstName(user.name) : null,
    recentOrders: commerce.recentOrders,
  });

  let aiConfig: ReturnType<typeof getAiConfig>;
  try {
    aiConfig = getAiConfig();
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return jsonError(
        "MECO is running in atelier mode right now. I can still help with products, your bag, delivery and orders.",
        "AI_NOT_CONFIGURED",
        503,
      );
    }
    return jsonError(
      "The atelier line is unavailable right now.",
      "UNKNOWN",
      500,
    );
  }

  const upstream = new AbortController();
  let timedOut = false;

  const onClientAbort = () => {
    upstream.abort();
  };
  request.signal.addEventListener("abort", onClientAbort, { once: true });

  const timeout = setTimeout(() => {
    timedOut = true;
    upstream.abort();
  }, aiConfig.timeoutMs);

  let stream: AsyncGenerator<string>;
  try {
    const completion = await createChatCompletionStream({
      messages: promptMessages,
      signal: upstream.signal,
    });
    stream = completion.stream;
  } catch (error) {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", onClientAbort);

    if (timedOut) {
      return jsonError(
        "MECO took too long to answer. Please try again.",
        "TIMEOUT",
        504,
        5,
      );
    }
    if (error instanceof AiProviderError) {
      if (error.status === 429) {
        return jsonError(
          "MECO is receiving a lot of requests right now. Please try again shortly.",
          "RATE_LIMITED",
          429,
          20,
        );
      }
      return jsonError(
        error.status === 401 || error.status === 403
          ? "MECO's AI connection is not authorized right now. Please contact the atelier team."
          : "The atelier's AI service is temporarily unavailable. Please try again.",
        "UPSTREAM_ERROR",
        error.status === 401 || error.status === 403 ? 502 : 503,
        error.retryable ? 5 : undefined,
      );
    }
    return jsonError(
      "The atelier's AI service is temporarily unavailable. Please try again.",
      "UPSTREAM_ERROR",
      503,
      5,
    );
  }

  const encoder = new TextEncoder();
  let closed = false;

  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AiChatStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      send({
        type: "meta",
        suggestions: localReply.suggestions?.slice(0, 4),
        actions: localReply.actions,
        orderLookup: localReply.orderLookup,
        orderNumber: localReply.orderNumber,
      });

      let fullText = "";
      try {
        for await (const delta of stream) {
          fullText += delta;
          send({ type: "delta", text: delta });
        }

        if (!fullText.trim()) {
          fullText = localReply.text;
          send({ type: "delta", text: localReply.text });
        }

        const products = selectReplyProducts({
          text: fullText,
          latestUserMessage,
          local: localReply,
          catalog,
          cartCount: context.cartCount,
        });

        send({
          type: "products",
          products,
          categories:
            products && catalog
              ? categorySuggestions(catalog, 4)
              : undefined,
        });
        send({ type: "done", finishReason: "stop" });
      } catch (error) {
        if (request.signal.aborted) {
          // The shopper closed the panel or navigated away. Keep the partial
          // text they already received and stop quietly.
        } else if (timedOut) {
          send({
            type: "error",
            error: "MECO took too long to answer. Please try again.",
            code: "TIMEOUT",
            retryable: true,
          });
        } else if (error instanceof AiProviderError) {
          send({
            type: "error",
            error: "The atelier's AI service dropped the line. Please try again.",
            code: "UPSTREAM_ERROR",
            retryable: error.retryable,
          });
        } else {
          send({
            type: "error",
            error: "The atelier line dropped. Please try again.",
            code: "UNKNOWN",
            retryable: true,
          });
        }
      } finally {
        clearTimeout(timeout);
        request.signal.removeEventListener("abort", onClientAbort);
        closed = true;
        try {
          controller.close();
        } catch {
          // The client already closed the stream.
        }
      }
    },
    cancel() {
      closed = true;
      upstream.abort();
      clearTimeout(timeout);
      request.signal.removeEventListener("abort", onClientAbort);
    },
  });

  return new Response(responseStream, {
    status: 200,
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      configured: isAiConfigured(),
    },
    { headers: NO_STORE_HEADERS },
  );
}
