"use client";

import type {
  AiChatErrorBody,
  AiChatErrorCode,
  AiChatRequest,
  AiChatStreamEvent,
  AssistantAction,
  AssistantCategory,
  AssistantProduct,
} from "./types";

export class MecoApiError extends Error {
  readonly code: AiChatErrorCode;
  readonly status: number;
  readonly retryAfter?: number;

  constructor(
    message: string,
    code: AiChatErrorCode,
    status: number,
    retryAfter?: number,
  ) {
    super(message);
    this.name = "MecoApiError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError"))
  );
}

export type MecoStreamHandler = (event: AiChatStreamEvent) => void;

function parseRetryAfter(response: Response) {
  const raw = response.headers.get("Retry-After");
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function readErrorBody(response: Response) {
  try {
    return (await response.json()) as AiChatErrorBody;
  } catch {
    return null;
  }
}

function fallbackError(status: number) {
  if (status === 429) {
    return "MECO is handling a lot of conversations right now. Please try again shortly.";
  }
  if (status === 503) {
    return "MECO's AI line is unavailable right now. Please try again.";
  }
  return "MECO couldn't send that message. Please try again.";
}

function parseSseEvent(raw: string): AiChatStreamEvent | null {
  const dataLines: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^ /, ""));
    }
  }

  const data = dataLines.length ? dataLines.join("\n") : raw.trim();
  if (!data || data === "[DONE]") return null;

  try {
    const payload = JSON.parse(data) as Record<string, unknown>;
    if (typeof payload.type !== "string") return null;

    if (payload.type === "delta" && typeof payload.text === "string") {
      return { type: "delta", text: payload.text };
    }
    if (payload.type === "done") {
      return {
        type: "done",
        finishReason:
          typeof payload.finishReason === "string"
            ? payload.finishReason
            : undefined,
      };
    }
    if (payload.type === "error") {
      return {
        type: "error",
        error:
          typeof payload.error === "string"
            ? payload.error
            : "The atelier line dropped. Please try again.",
        code:
          typeof payload.code === "string"
            ? (payload.code as AiChatErrorCode)
            : "UNKNOWN",
        retryable: payload.retryable !== false,
      };
    }
    if (payload.type === "meta") {
      return {
        type: "meta",
        suggestions: Array.isArray(payload.suggestions)
          ? payload.suggestions.filter(
              (suggestion): suggestion is string =>
                typeof suggestion === "string",
            )
          : undefined,
        actions: Array.isArray(payload.actions)
          ? (payload.actions as AssistantAction[])
          : undefined,
        orderLookup: payload.orderLookup === true,
        orderNumber:
          typeof payload.orderNumber === "string"
            ? payload.orderNumber
            : undefined,
      };
    }
    if (payload.type === "products") {
      return {
        type: "products",
        products: Array.isArray(payload.products)
          ? (payload.products as AssistantProduct[])
          : undefined,
        categories: Array.isArray(payload.categories)
          ? (payload.categories as AssistantCategory[])
          : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * POST a conversation to the secure chat route and stream typed events back.
 *
 * The parser handles arbitrary chunk boundaries, CRLF or LF separators, and
 * both `data:` framed events and raw JSON lines (a few compatible gateways do
 * the latter).
 */
export async function streamMecoChat(input: {
  request: AiChatRequest;
  signal?: AbortSignal;
  onEvent: MecoStreamHandler;
}) {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(input.request),
    signal: input.signal,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await readErrorBody(response);
    throw new MecoApiError(
      payload?.error || fallbackError(response.status),
      payload?.code ??
        (response.status === 429 ? "RATE_LIMITED" : "UPSTREAM_ERROR"),
      response.status,
      payload?.retryAfter ?? parseRetryAfter(response),
    );
  }

  if (!response.body) {
    throw new MecoApiError(
      "MECO couldn't open a response stream. Please try again.",
      "UNKNOWN",
      502,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flush = (raw: string) => {
    const event = parseSseEvent(raw);
    if (event) input.onEvent(event);
    return event;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.match(/\r?\n\r?\n/);
      while (boundary?.index !== undefined) {
        const raw = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        flush(raw);
        boundary = buffer.match(/\r?\n\r?\n/);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) flush(buffer);
  } finally {
    reader.releaseLock();
  }
}
