import { describe, expect, it } from "vitest";
import {
  AuthenticationError,
  GitHubAPIError,
  NetworkError,
  RateLimitError,
  ValidationError,
  formatErrorForLLM,
} from "../errors/index.js";

describe("formatErrorForLLM", () => {
  it("transforma un 404 en un mensaje con owner y repo", () => {
    const error = new GitHubAPIError("Not Found", 404, {
      context: { owner: "FFigueroa26", repo: "no-existe" },
    });

    expect(formatErrorForLLM(error)).toBe(
      "El repositorio FFigueroa26/no-existe no fue encontrado. Verifica el nombre e intenta de nuevo.",
    );
  });

  it("explica un problema de autenticación sin mostrar detalles técnicos", () => {
    const message = formatErrorForLLM(new AuthenticationError("token vencido"));

    expect(message).toContain("No se pudo autenticar con GitHub");
    expect(message).not.toContain("token vencido");
  });

  it("indica cuánto esperar ante rate limiting", () => {
    const message = formatErrorForLLM(
      new RateLimitError("límite alcanzado", 30),
    );

    expect(message).toContain("30 segundos");
  });

  it("devuelve el mensaje de validación tal cual", () => {
    const message = formatErrorForLLM(
      new ValidationError("El nombre del repositorio debe tener al menos 3 caracteres."),
    );

    expect(message).toBe(
      "El nombre del repositorio debe tener al menos 3 caracteres.",
    );
  });

  it("maneja errores de red con un mensaje comprensible", () => {
    const message = formatErrorForLLM(new NetworkError("fetch failed"));

    expect(message).toContain("No se pudo conectar con GitHub");
  });

  it("maneja errores desconocidos sin exponer stack traces", () => {
    const message = formatErrorForLLM(new Error("boom"));

    expect(message).toBe("Ocurrió un error inesperado: boom");
  });
});
