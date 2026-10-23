import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createRepositorySchema } from "../schemas/index.js";
import { createRepository } from "../github/operations.js";
import { formatErrorForLLM } from "../errors/index.js";
import { logger } from "../utils/logging.js";

export function registerCreateRepositoryTool(server: McpServer): void {
  server.registerTool(
    "create_repository",
    {
      title: "Crear repositorio",
      description:
        "Crea un nuevo repositorio en GitHub para el usuario autenticado. Úsalo solo cuando el usuario pida crear un repositorio nuevo; no lo uses para buscar ni modificar repositorios existentes.",
      inputSchema: createRepositorySchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      try {
        const repository = await createRepository(input);
        const visibility = repository.private ? "privado" : "público";
        const text = [
          `Repositorio creado: ${repository.fullName}`,
          `Visibilidad: ${visibility}`,
          `Rama por defecto: ${repository.defaultBranch}`,
          `URL: ${repository.url}`,
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (error) {
        logger.error("Falló create_repository", {
          error: error instanceof Error ? error.message : "desconocido",
        });
        return {
          content: [{ type: "text", text: formatErrorForLLM(error) }],
          isError: true,
        };
      }
    },
  );
}
