import { z } from "zod";

const NEW_REPO_NAME_PATTERN = /^[A-Za-z0-9-]+$/;
const EXISTING_REPO_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const OWNER_PATTERN = /^[A-Za-z0-9-]+$/;

export const ownerSchema = z
  .string()
  .trim()
  .min(1, "El owner es obligatorio.")
  .max(39, "El owner no puede superar los 39 caracteres.")
  .regex(
    OWNER_PATTERN,
    "El owner solo puede contener letras, números y guiones (sin espacios).",
  )
  .describe(
    "Usuario u organización dueño del repositorio en GitHub (ej: 'octocat').",
  );

export const repoNameSchema = z
  .string()
  .trim()
  .min(3, "El nombre del repositorio debe tener al menos 3 caracteres.")
  .max(100, "El nombre del repositorio no puede superar los 100 caracteres.")
  .regex(
    NEW_REPO_NAME_PATTERN,
    "El nombre del repositorio solo puede contener letras, números y guiones (sin espacios ni símbolos).",
  )
  .describe(
    "Nombre del nuevo repositorio a crear en GitHub (ej: 'mi-proyecto'). No incluyas el owner.",
  );

export const existingRepoNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre del repositorio es obligatorio.")
  .max(100, "El nombre del repositorio no puede superar los 100 caracteres.")
  .regex(
    EXISTING_REPO_NAME_PATTERN,
    "El nombre del repositorio solo puede contener letras, números, puntos, guiones y guiones bajos.",
  )
  .refine((value) => value !== "." && value !== "..", {
    message: "El nombre del repositorio no puede ser '.' ni '..'.",
  })
  .describe(
    "Nombre de un repositorio existente en GitHub (ej: 'mi-proyecto'). No incluyas el owner.",
  );

export const branchSchema = z
  .string()
  .trim()
  .min(1, "La rama no puede estar vacía.")
  .max(255, "La rama no puede superar los 255 caracteres.")
  .regex(
    /^[A-Za-z0-9._/-]+$/,
    "La rama solo puede contener letras, números, puntos, guiones, guiones bajos y barras.",
  )
  .describe("Rama sobre la que operar (ej: 'main'). Por defecto 'main'.");

export const filePathSchema = z
  .string()
  .trim()
  .min(1, "La ruta del archivo es obligatoria.")
  .max(4096, "La ruta del archivo es demasiado larga.")
  .refine((value) => !value.startsWith("/"), {
    message: "La ruta del archivo debe ser relativa (no puede empezar con '/').",
  })
  .refine((value) => !value.includes(".."), {
    message: "La ruta del archivo no puede contener '..'.",
  })
  .describe(
    "Ruta del archivo dentro del repositorio, relativa a la raíz (ej: 'src/index.ts').",
  );

export const createRepositorySchema = z
  .object({
    name: repoNameSchema,
    description: z
      .string()
      .trim()
      .max(350, "La descripción no puede superar los 350 caracteres.")
      .optional()
      .describe("Descripción breve del repositorio. Opcional."),
    private: z
      .boolean()
      .optional()
      .describe(
        "Si es true, el repositorio se crea privado. Por defecto es público.",
      ),
  })
  .strict();

export const createIssueSchema = z
  .object({
    owner: ownerSchema,
    repo: existingRepoNameSchema,
    title: z
      .string()
      .trim()
      .min(1, "El título del issue es obligatorio.")
      .max(256, "El título del issue no puede superar los 256 caracteres.")
      .describe("Título corto y descriptivo del issue."),
    body: z
      .string()
      .max(65536, "El body del issue es demasiado largo.")
      .optional()
      .describe("Descripción detallada del issue en Markdown. Opcional."),
  })
  .strict();

export const listRepositoriesSchema = z
  .object({
    visibility: z
      .enum(["all", "public", "private"])
      .optional()
      .describe(
        "Filtra por visibilidad: 'all', 'public' o 'private'. Por defecto 'all'.",
      ),
    perPage: z
      .number()
      .int("perPage debe ser un número entero.")
      .min(1, "perPage debe ser al menos 1.")
      .max(100, "perPage no puede superar 100.")
      .optional()
      .describe("Cantidad de repositorios a devolver (1-100). Por defecto 30."),
  })
  .strict();

export const createCommitSchema = z
  .object({
    owner: ownerSchema,
    repo: existingRepoNameSchema,
    path: filePathSchema,
    content: z
      .string()
      .describe(
        "Contenido completo del archivo a crear o reemplazar (texto plano o Markdown).",
      ),
    message: z
      .string()
      .trim()
      .min(1, "El mensaje del commit es obligatorio.")
      .max(2048, "El mensaje del commit es demasiado largo.")
      .describe("Mensaje del commit (ej: 'docs: agrega README')."),
    branch: branchSchema.optional(),
  })
  .strict();

export const listIssuesSchema = z
  .object({
    owner: ownerSchema,
    repo: existingRepoNameSchema,
    state: z
      .enum(["open", "closed", "all"])
      .optional()
      .describe(
        "Estado de los issues a listar: 'open', 'closed' o 'all'. Por defecto 'open'.",
      ),
    perPage: z
      .number()
      .int("perPage debe ser un número entero.")
      .min(1, "perPage debe ser al menos 1.")
      .max(100, "perPage no puede superar 100.")
      .optional()
      .describe("Cantidad de issues a devolver (1-100). Por defecto 30."),
  })
  .strict();

export type CreateRepositoryInput = z.infer<typeof createRepositorySchema>;
export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type ListRepositoriesInput = z.infer<typeof listRepositoriesSchema>;
export type CreateCommitInput = z.infer<typeof createCommitSchema>;
export type ListIssuesInput = z.infer<typeof listIssuesSchema>;
