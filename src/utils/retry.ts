import {
  GitHubAPIError,
  NetworkError,
  RateLimitError,
} from "../errors/index.js";
import { logger } from "./logging.js";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 8000;

export function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }
  if (error instanceof NetworkError) {
    return true;
  }
  if (error instanceof GitHubAPIError && typeof error.status === "number") {
    return (
      error.status === 429 ||
      error.status === 500 ||
      error.status === 502 ||
      error.status === 503 ||
      error.status === 504
    );
  }
  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function computeDelay(
  attempt: number,
  error: unknown,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  if (error instanceof RateLimitError && error.retryAfterSeconds !== undefined) {
    return Math.min(error.retryAfterSeconds * 1000, maxDelayMs);
  }
  const exponential = baseDelayMs * 2 ** (attempt - 1);
  return Math.min(exponential, maxDelayMs);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delay = computeDelay(attempt, error, baseDelayMs, maxDelayMs);
      logger.warn("Reintentando operación con GitHub", {
        attempt,
        maxAttempts,
        delayMs: delay,
      });
      await sleep(delay);
    }
  }

  throw lastError;
}
