import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createIssueSchema } from "../schemas/index.js";
import { createIssue } from "../github/operations.js";
import { formatErrorForLLM } from "../errors/index.js";
import { logger } from "../utils/logging.js";

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
      try {
        const issue = await createIssue(input);
        const text = [
          `Issue #${issue.number} creado en ${input.owner}/${input.repo}: "${issue.title}"`,
          `Estado: ${issue.state}`,
          `Autor: ${issue.author}`,
          `URL: ${issue.url}`,
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (error) {
        logger.error("Falló create_issue", {
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
