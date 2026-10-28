import "server-only";

import type { AiChatMessage } from "./prompt";

export type AiProviderConfig = {
  apiKey: string;
  endpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  isOpenRouter: boolean;
  reasoningEffort?: string;
};

export class AiNotConfiguredError extends Error {
  readonly code = "AI_NOT_CONFIGURED" as const;

  constructor() {
    super("AI is not configured");
    this.name = "AiNotConfiguredError";
  }
}

export class AiProviderError extends Error {
  readonly code = "UPSTREAM_ERROR" as const;

  constructor(
    readonly status: number,
    readonly retryable: boolean,
    message = "The AI provider could not complete the request.",
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function isAiConfigured() {
  return Boolean(process.env.AI_API_KEY?.trim());
}

export function getAiConfig(): AiProviderConfig {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) throw new AiNotConfiguredError();

  const baseUrl = (
    process.env.AI_API_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/+$/, "");
  const endpoint = baseUrl.endsWith("/chat/completions")
    ? baseUrl
    : `${baseUrl}/chat/completions`;

  const reasoningEffort = process.env.AI_REASONING_EFFORT?.trim().toLowerCase();
  const supportedReasoningEfforts = new Set([
    "none",
    "minimal",
    "low",
    "medium",
    "high",
  ]);

  return {
    apiKey,
    endpoint,
    model: process.env.AI_MODEL?.trim() || "gpt-4o-mini",
    maxTokens: clampNumber(
      process.env.AI_MAX_OUTPUT_TOKENS,
      700,
      64,
      4_000,
    ),
    temperature: clampNumber(process.env.AI_TEMPERATURE, 0.6, 0, 2),
    timeoutMs: clampNumber(
      process.env.AI_REQUEST_TIMEOUT_MS,
      60_000,
      5_000,
      120_000,
    ),
    isOpenRouter: baseUrl.includes("openrouter.ai"),
    reasoningEffort:
      reasoningEffort && supportedReasoningEfforts.has(reasoningEffort)
        ? reasoningEffort
        : undefined,
  };
}

function providerHeaders(config: AiProviderConfig) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };

  if (config.isOpenRouter) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (siteUrl) headers["HTTP-Referer"] = siteUrl;
    headers["X-Title"] = "MeCart";
  }

  return headers;
}

async function requestCompletion(
  config: AiProviderConfig,
  messages: AiChatMessage[],
  signal: AbortSignal,
  includeOptionalParams: boolean,
) {
  const payload: Record<string, unknown> = {
    model: config.model,
    messages,
    stream: true,
  };

  if (includeOptionalParams) {
    payload.temperature = config.temperature;
    payload.max_tokens = config.maxTokens;
    if (config.reasoningEffort) {
      payload.reasoning_effort = config.reasoningEffort;
    }
  }

  return fetch(config.endpoint, {
    method: "POST",
    headers: providerHeaders(config),
    body: JSON.stringify(payload),
    signal,
    cache: "no-store",
  });
}

/**
 * Open an upstream chat-completions stream. The provider key never leaves this
 * module, and upstream error bodies are not returned to the client.
 */
export async function createChatCompletionStream(input: {
  messages: AiChatMessage[];
  signal: AbortSignal;
}) {
  const config = getAiConfig();
  let response = await requestCompletion(
    config,
    input.messages,
    input.signal,
    true,
  );

  // Reasoning models and some OpenAI-compatible gateways reject optional
  // sampling parameters. Retry once with the minimal supported payload.
  if (response.status === 400) {
    const clone = response.clone();
    const body = await clone.text().catch(() => "");
    if (/temperature|max_tokens|max_completion_tokens|reasoning_effort|unsupported/i.test(body)) {
      response = await requestCompletion(
        config,
        input.messages,
        input.signal,
        false,
      );
    }
  }

  if (!response.ok) {
    const retryable =
      response.status === 408 ||
      response.status === 409 ||
      response.status === 429 ||
      response.status >= 500;
    throw new AiProviderError(response.status, retryable);
  }

  if (!response.body) {
    throw new AiProviderError(502, true, "The AI provider returned no stream.");
  }

  return {
    model: config.model,
    stream: parseProviderStream(response, input.signal),
  };
}

const DONE = Symbol("done");

function textFromContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("");
  }
  return "";
}

function extractChunkContent(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  const choices = record.choices;

  if (Array.isArray(choices) && choices.length) {
    const choice = choices[0] as Record<string, unknown>;
    const delta = choice.delta as Record<string, unknown> | undefined;
    const message = choice.message as Record<string, unknown> | undefined;
    const fromDelta = textFromContent(delta?.content);
    if (fromDelta) return fromDelta;
    const fromMessage = textFromContent(message?.content);
    if (fromMessage) return fromMessage;
    if (typeof choice.text === "string") return choice.text;
  }

  return textFromContent(record.content);
}

function parseEvent(raw: string): string | typeof DONE | null {
  const dataLines: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^ /, ""));
    }
  }

  // A few gateways emit raw JSON lines without the SSE data prefix.
  const data = dataLines.length
    ? dataLines.join("\n")
    : raw.trim().startsWith("{")
      ? raw.trim()
      : "";

  if (!data) return null;
  if (data === "[DONE]") return DONE;

  try {
    const payload = JSON.parse(data) as Record<string, unknown>;
    if (payload.error) {
      throw new AiProviderError(502, true, "The AI provider reported an error.");
    }
    const content = extractChunkContent(payload);
    return content || null;
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    return null;
  }
}

async function* parseProviderStream(
  response: Response,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    // Some compatible gateways ignore `stream: true` and return JSON.
    const payload = await response.json().catch(() => null);
    const content = extractChunkContent(payload);
    if (content) yield content;
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal.aborted) {
        throw new DOMException("The request was aborted.", "AbortError");
      }

      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.match(/\r?\n\r?\n/);
      while (boundary?.index !== undefined) {
        const raw = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const parsed = parseEvent(raw);
        if (parsed === DONE) return;
        if (parsed) yield parsed;
        boundary = buffer.match(/\r?\n\r?\n/);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      const parsed = parseEvent(buffer);
      if (parsed && parsed !== DONE) yield parsed;
    }
  } finally {
    reader.releaseLock();
  }
}
