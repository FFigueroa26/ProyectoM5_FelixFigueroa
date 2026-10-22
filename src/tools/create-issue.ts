import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createIssueSchema } from "../schemas/index.js";

export function registerCreateIssueTool(server: McpServer): void {
  server.registerTool(
    "create_issue",
    {
      title: "Crear issue",
      description:
        "Abre un issue nuevo en un repositorio existente. Úsalo cuando el usuario pida reportar un bug, sugerir una mejora o registrar una tarea en un repositorio específico.",
      inputSchema: createIssueSchema,
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
            text: `Operación pendiente de integración con GitHub: crear el issue '${input.title}' en ${input.owner}/${input.repo}.`,
          },
        ],
      };
    },
  );
}
