// Translate raw Anthropic / runner errors into short, warm, user-facing
// messages. Never leak the fact that we use Anthropic, an API key, or a
// specific model. Never dump JSON in front of a user.
//
// Raw errors are still logged to the server console for debugging —
// this only affects what ends up in the DB (and therefore in the theater
// panel + any share-visible surface).

export type ErrorCategory =
  | "credits_exhausted"
  | "rate_limited"
  | "auth_error"
  | "overloaded"
  | "model_unavailable"
  | "content_blocked"
  | "network"
  | "timeout"
  | "generation_incomplete"
  | "unknown";

export type NormalizedError = {
  userMessage: string;
  category: ErrorCategory;
  canRetry: boolean;
};

// Try to pull whatever readable text we can out of an unknown error shape.
function extractText(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (raw instanceof Error) return raw.message;
  if (typeof raw === "object") {
    try {
      return JSON.stringify(raw);
    } catch {
      return String(raw);
    }
  }
  return String(raw);
}

const MSG = {
  credits_exhausted:
    "The agent is temporarily offline for maintenance. We're on it — try again in a few minutes.",
  rate_limited:
    "The agent is at capacity right now. Give it about a minute and try again.",
  auth_error:
    "The agent had a brief connection issue. Try again in a moment.",
  overloaded:
    "The agent is a bit overwhelmed right now. Give it a minute and retry.",
  model_unavailable:
    "The agent needs a moment. Try again shortly.",
  content_blocked:
    "This draft couldn't complete because of a content restriction. Try rephrasing your brief.",
  network:
    "Connection dropped mid-draft. Try again.",
  timeout:
    "The draft took longer than expected and timed out. Try again.",
  generation_incomplete:
    "The draft finished early. Try again — the agent will pick up where it left off.",
  unknown:
    "The draft didn't finish. Try again — if it keeps happening, drop us a note.",
} as const;

export function normalizeGenerationError(raw: unknown): NormalizedError {
  const text = extractText(raw).toLowerCase();

  // Credits / billing
  if (
    text.includes("credit balance") ||
    text.includes("insufficient balance") ||
    text.includes("insufficient_quota") ||
    text.includes("billing")
  ) {
    return {
      userMessage: MSG.credits_exhausted,
      category: "credits_exhausted",
      canRetry: false,
    };
  }

  // Rate limit
  if (
    text.includes("rate_limit") ||
    text.includes("rate limit") ||
    text.includes("429") ||
    text.includes("too many requests")
  ) {
    return {
      userMessage: MSG.rate_limited,
      category: "rate_limited",
      canRetry: true,
    };
  }

  // Auth / API key
  if (
    text.includes("invalid_api_key") ||
    text.includes("authentication_error") ||
    text.includes("invalid x-api-key") ||
    text.includes("api key") ||
    text.includes("401") ||
    text.includes("unauthorized")
  ) {
    return {
      userMessage: MSG.auth_error,
      category: "auth_error",
      canRetry: true,
    };
  }

  // Overloaded (Anthropic 529 / overloaded_error)
  if (
    text.includes("overloaded") ||
    text.includes("529") ||
    text.includes("server_error") ||
    text.includes("service unavailable") ||
    text.includes("503")
  ) {
    return {
      userMessage: MSG.overloaded,
      category: "overloaded",
      canRetry: true,
    };
  }

  // Model not found / deprecated
  if (
    text.includes("model_not_found") ||
    text.includes("not_found_error") ||
    text.includes("model not") ||
    text.includes("deprecated")
  ) {
    return {
      userMessage: MSG.model_unavailable,
      category: "model_unavailable",
      canRetry: false,
    };
  }

  // Content policy / safety
  if (
    text.includes("content_policy") ||
    text.includes("policy_violation") ||
    text.includes("safety") ||
    text.includes("blocked")
  ) {
    return {
      userMessage: MSG.content_blocked,
      category: "content_blocked",
      canRetry: false,
    };
  }

  // Timeout
  if (
    text.includes("timeout") ||
    text.includes("timed out") ||
    text.includes("etimedout")
  ) {
    return {
      userMessage: MSG.timeout,
      category: "timeout",
      canRetry: true,
    };
  }

  // Network / connection
  if (
    text.includes("econnreset") ||
    text.includes("econnrefused") ||
    text.includes("enotfound") ||
    text.includes("network") ||
    text.includes("fetch failed") ||
    text.includes("socket hang up")
  ) {
    return {
      userMessage: MSG.network,
      category: "network",
      canRetry: true,
    };
  }

  // Runner-specific: incomplete output signal
  if (text.includes("incomplete") || text.includes("truncated")) {
    return {
      userMessage: MSG.generation_incomplete,
      category: "generation_incomplete",
      canRetry: true,
    };
  }

  return { userMessage: MSG.unknown, category: "unknown", canRetry: true };
}
