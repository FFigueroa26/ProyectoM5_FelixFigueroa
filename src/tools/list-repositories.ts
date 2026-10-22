import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRepositoriesSchema } from "../schemas/index.js";

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
      const visibility = input.visibility ?? "all";
      const perPage = input.perPage ?? 30;
      return {
        content: [
          {
            type: "text",
            text: `Operación pendiente de integración con GitHub: listar repositorios (visibilidad: ${visibility}, perPage: ${perPage}).`,
          },
        ],
      };
    },
  );
}
