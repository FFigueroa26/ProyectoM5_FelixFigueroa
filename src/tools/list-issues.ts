import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listIssuesSchema } from "../schemas/index.js";
import { listIssues } from "../github/operations.js";
import { formatErrorForLLM } from "../errors/index.js";
import { logger } from "../utils/logging.js";

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
      try {
        const issues = await listIssues(input);
        const state = input.state ?? "open";

        if (issues.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No se encontraron issues con estado '${state}' en ${input.owner}/${input.repo}.`,
              },
            ],
          };
        }

        const lines = issues.map(
          (issue) =>
            `- #${issue.number} [${issue.state}] ${issue.title} (por ${issue.author}) - ${issue.url}`,
        );

        return {
          content: [
            {
              type: "text",
              text: `Issues encontrados (${issues.length}):\n${lines.join("\n")}`,
            },
          ],
        };
      } catch (error) {
        logger.error("Falló list_issues", {
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
