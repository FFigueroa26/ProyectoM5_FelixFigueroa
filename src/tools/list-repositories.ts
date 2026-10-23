import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRepositoriesSchema } from "../schemas/index.js";
import { listRepositories } from "../github/operations.js";
import { formatErrorForLLM } from "../errors/index.js";
import { logger } from "../utils/logging.js";

export function registerListRepositoriesTool(server: McpServer): void {
  server.registerTool(
    "list_repositories",
    {
      title: "Listar repositorios",
      description:
        "Lista los repositorios del usuario autenticado en GitHub. Úsalo cuando el usuario pregunte qué repositorios tiene o cuando necesites conocer nombres de repositorios antes de operar sobre ellos.",
      inputSchema: listRepositoriesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      try {
        const repositories = await listRepositories(input);

        if (repositories.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No se encontraron repositorios para el usuario autenticado.",
              },
            ],
          };
        }

        const lines = repositories.map((repository) => {
          const visibility = repository.private ? "privado" : "público";
          const description = repository.description ?? "sin descripción";
          return `- ${repository.fullName} (${visibility}): ${description} - ${repository.url}`;
        });

        return {
          content: [
            {
              type: "text",
              text: `Repositorios encontrados (${repositories.length}):\n${lines.join("\n")}`,
            },
          ],
        };
      } catch (error) {
        logger.error("Falló list_repositories", {
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
