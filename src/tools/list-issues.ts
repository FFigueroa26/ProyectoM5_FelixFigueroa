import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listIssuesSchema } from "../schemas/index.js";

export function registerListIssuesTool(server: McpServer): void {
  server.registerTool(
    "list_issues",
    {
      title: "Listar issues",
      description:
        "Lista los issues de un repositorio existente, filtrando por estado (abiertos, cerrados o todos). Úsalo cuando el usuario pida ver los issues de un repositorio específico.",
      inputSchema: listIssuesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      const state = input.state ?? "open";
      const perPage = input.perPage ?? 30;
      return {
        content: [
          {
            type: "text",
            text: `Operación pendiente de integración con GitHub: listar issues de ${input.owner}/${input.repo} (estado: ${state}, perPage: ${perPage}).`,
          },
        ],
      };
    },
  );
}
