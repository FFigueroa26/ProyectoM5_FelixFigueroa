import { Octokit } from "@octokit/rest";
import {
  AppError,
  AuthenticationError,
  GitHubAPIError,
  NetworkError,
  RateLimitError,
} from "../errors/index.js";
import { logger } from "../utils/logging.js";

let octokitInstance: Octokit | null = null;

export function getGithubToken(): string {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token === undefined || token.length === 0) {
    throw new AuthenticationError(
      "Falta configurar GITHUB_TOKEN. Crea un archivo .env con tu token de GitHub (scopes: repo, user, admin:org).",
    );
  }
  return token;
}

export function getOctokit(): Octokit {
  if (octokitInstance === null) {
    octokitInstance = new Octokit({ auth: getGithubToken() });
    logger.debug("Cliente de Octokit inicializado");
  }
  return octokitInstance;
}

interface GitHubErrorLike {
  status?: number;
  message?: string;
  response?: {
    headers?: Record<string, string | number | undefined>;
  };
  code?: string;
}

function asGitHubErrorLike(error: unknown): GitHubErrorLike {
  if (typeof error === "object" && error !== null) {
    return error as GitHubErrorLike;
  }
  return {};
}

function readHeader(
  headers: Record<string, string | number | undefined> | undefined,
  name: string,
): string | undefined {
  const value = headers?.[name];
  if (value === undefined) {
    return undefined;
  }
  return String(value);
}

function parseRetryAfterSeconds(
  headers: Record<string, string | number | undefined> | undefined,
): number | undefined {
  const retryAfter = readHeader(headers, "retry-after");
  if (retryAfter !== undefined) {
    const parsed = Number(retryAfter);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const reset = readHeader(headers, "x-ratelimit-reset");
  if (reset !== undefined) {
    const resetSeconds = Number(reset);
    if (Number.isFinite(resetSeconds)) {
      const seconds = resetSeconds - Math.floor(Date.now() / 1000);
      if (seconds > 0) {
        return seconds;
      }
    }
  }

  return undefined;
}

function isRateLimited(error: GitHubErrorLike): boolean {
  const headers = error.response?.headers;
  if (error.status === 429) {
    return true;
  }
  const remaining = readHeader(headers, "x-ratelimit-remaining");
  const retryAfter = readHeader(headers, "retry-after");
  return remaining === "0" || retryAfter !== undefined;
}

function isNetworkFailure(error: GitHubErrorLike): boolean {
  const networkCodes = [
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "ETIMEDOUT",
    "EAI_AGAIN",
  ];
  if (error.code !== undefined && networkCodes.includes(error.code)) {
    return true;
  }
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("network") ||
    message.includes("fetch failed") ||
    message.includes("socket hang up")
  );
}

export function mapGitHubError(
  error: unknown,
  context: Record<string, unknown>,
): never {
  if (error instanceof AppError) {
    throw error;
  }

  const githubError = asGitHubErrorLike(error);
  const status = githubError.status;
  const headers = githubError.response?.headers;
  const message = githubError.message ?? "Error desconocido de GitHub";

  if (status === 401) {
    throw new AuthenticationError(
      "El token de GitHub es inválido o expiró. Genera uno nuevo y actualiza GITHUB_TOKEN.",
      { context, cause: error },
    );
  }

  if (status === 403 || status === 429) {
    if (isRateLimited(githubError)) {
      throw new RateLimitError(
        "Se alcanzó el límite de solicitudes permitidas por GitHub.",
        parseRetryAfterSeconds(headers),
        { context, cause: error },
      );
    }
    throw new GitHubAPIError(
      "GitHub rechazó la operación por falta de permisos.",
      403,
      { context, cause: error },
    );
  }

  if (typeof status === "number") {
    throw new GitHubAPIError(message, status, { context, cause: error });
  }

  if (isNetworkFailure(githubError)) {
    throw new NetworkError(
      "No se pudo conectar con la API de GitHub.",
      { context, cause: error },
    );
  }

  throw new GitHubAPIError(message, undefined, { context, cause: error });
}
