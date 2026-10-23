import type { ErrorCode } from "../types.js";

export interface AppErrorOptions {
  context?: Record<string, unknown>;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly context: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.context = options.context ?? {};
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super("VALIDATION_ERROR", message, options);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super("AUTHENTICATION_ERROR", message, options);
  }
}

export class GitHubAPIError extends AppError {
  readonly status: number | undefined;

  constructor(
    message: string,
    status: number | undefined,
    options: AppErrorOptions = {},
  ) {
    super("GITHUB_API_ERROR", message, options);
    this.status = status;
  }
}

export class NetworkError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super("NETWORK_ERROR", message, options);
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number | undefined;

  constructor(
    message: string,
    retryAfterSeconds: number | undefined,
    options: AppErrorOptions = {},
  ) {
    super("RATE_LIMIT_ERROR", message, options);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function describeRepository(context: Record<string, unknown>): string | null {
  const owner = context.owner;
  const repo = context.repo;
  if (typeof owner === "string" && typeof repo === "string") {
    return `${owner}/${repo}`;
  }
  if (typeof repo === "string") {
    return repo;
  }
  return null;
}

export function formatErrorForLLM(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof AuthenticationError) {
    return "No se pudo autenticar con GitHub. Verifica que el GITHUB_TOKEN sea válido y tenga los permisos necesarios.";
  }

  if (error instanceof RateLimitError) {
    if (typeof error.retryAfterSeconds === "number") {
      return `GitHub limitó temporalmente las solicitudes. Intenta de nuevo en ${error.retryAfterSeconds} segundos.`;
    }
    return "GitHub limitó temporalmente las solicitudes. Espera un momento e intenta de nuevo.";
  }

  if (error instanceof GitHubAPIError) {
    const repository = describeRepository(error.context);

    if (error.status === 404) {
      if (repository !== null) {
        return `El repositorio ${repository} no fue encontrado. Verifica el nombre e intenta de nuevo.`;
      }
      return "El recurso solicitado no fue encontrado en GitHub. Verifica los datos e intenta de nuevo.";
    }

    if (error.status === 403) {
      return "GitHub rechazó la operación por falta de permisos. Verifica los scopes del token (repo, user, admin:org).";
    }

    if (error.status === 422) {
      return `GitHub rechazó los datos enviados: ${error.message}`;
    }

    if (typeof error.status === "number") {
      return `GitHub devolvió un error (${error.status}): ${error.message}`;
    }

    return `GitHub devolvió un error: ${error.message}`;
  }

  if (error instanceof NetworkError) {
    return "No se pudo conectar con GitHub. Verifica tu conexión a internet e intenta de nuevo.";
  }

  if (error instanceof Error) {
    return `Ocurrió un error inesperado: ${error.message}`;
  }

  return "Ocurrió un error inesperado al ejecutar la operación.";
}
