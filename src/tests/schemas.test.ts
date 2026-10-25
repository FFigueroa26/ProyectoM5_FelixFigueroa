import { describe, expect, it } from "vitest";
import {
  createCommitSchema,
  createIssueSchema,
  createRepositorySchema,
  listRepositoriesSchema,
} from "../schemas/index.js";

describe("createRepositorySchema", () => {
  it("acepta un nombre válido de repositorio", () => {
    const result = createRepositorySchema.safeParse({ name: "mi-repo-2026" });
    expect(result.success).toBe(true);
  });

  it("rechaza nombres de menos de 3 caracteres", () => {
    const result = createRepositorySchema.safeParse({ name: "ab" });
    expect(result.success).toBe(false);
  });

  it("rechaza nombres con espacios o símbolos inválidos", () => {
    const result = createRepositorySchema.safeParse({ name: "mi repo!" });
    expect(result.success).toBe(false);
  });

  it("rechaza campos desconocidos por ser un schema estricto", () => {
    const result = createRepositorySchema.safeParse({
      name: "mi-repo",
      extra: "no permitido",
    });
    expect(result.success).toBe(false);
  });
});

describe("createIssueSchema", () => {
  it("acepta repositorios existentes con punto o guion bajo", () => {
    const result = createIssueSchema.safeParse({
      owner: "FFigueroa26",
      repo: "next.js",
      title: "Bug en el login",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un título vacío con mensaje claro", () => {
    const result = createIssueSchema.safeParse({
      owner: "FFigueroa26",
      repo: "mi-repo",
      title: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("título");
    }
  });
});

describe("createCommitSchema", () => {
  it("rechaza rutas absolutas", () => {
    const result = createCommitSchema.safeParse({
      owner: "FFigueroa26",
      repo: "mi-repo",
      path: "/etc/passwd",
      content: "hola",
      message: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza rutas con traversal", () => {
    const result = createCommitSchema.safeParse({
      owner: "FFigueroa26",
      repo: "mi-repo",
      path: "../secreto.txt",
      content: "hola",
      message: "test",
    });
    expect(result.success).toBe(false);
  });
});

describe("listRepositoriesSchema", () => {
  it("acepta parámetros vacíos", () => {
    const result = listRepositoriesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rechaza perPage fuera de rango", () => {
    const result = listRepositoriesSchema.safeParse({ perPage: 101 });
    expect(result.success).toBe(false);
  });
});
