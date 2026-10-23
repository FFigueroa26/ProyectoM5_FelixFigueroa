export type LogLevel = "debug" | "info" | "warn" | "error";

const TOKEN_PATTERNS = [
  /ghp_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
];

function redact(text: string): string {
  let result = text;
  for (const pattern of TOKEN_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  const token = process.env.GITHUB_TOKEN;
  if (token !== undefined && token.length > 0) {
    result = result.split(token).join("[REDACTED]");
  }
  return result;
}

function serializeMeta(meta: Record<string, unknown> | undefined): string {
  if (meta === undefined) {
    return "";
  }
  try {
    return ` ${redact(JSON.stringify(meta))}`;
  } catch {
    return " [meta no serializable]";
  }
}

function write(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${redact(message)}${serializeMeta(meta)}\n`;
  process.stderr.write(line);
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.LOG_LEVEL === "debug") {
      write("debug", message, meta);
    }
  },
  info(message: string, meta?: Record<string, unknown>): void {
    write("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    write("warn", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>): void {
    write("error", message, meta);
  },
};
