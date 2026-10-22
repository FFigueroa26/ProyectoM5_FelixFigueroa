import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createRepositorySchema } from "../schemas/index.js";

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
      return {
        content: [
          {
            type: "text",
            text: `Operación pendiente de integración con GitHub: crear el repositorio '${input.name}'.`,
          },
        ],
      };
    },
  );
}
