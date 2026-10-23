import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createCommitSchema } from "../schemas/index.js";
import { createCommit } from "../github/operations.js";
import { formatErrorForLLM } from "../errors/index.js";
import { logger } from "../utils/logging.js";

export function registerCreateCommitTool(server: McpServer): void {
  server.registerTool(
    "create_commit",
    {
      title: "Crear commit",
      description:
        "Crea o modifica un archivo en un repositorio existente mediante un commit en una rama. Úsalo cuando el usuario pida agregar o editar un archivo y confirmar el cambio con un mensaje de commit.",
      inputSchema: createCommitSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      try {
        const commit = await createCommit(input);
        const shortSha = commit.sha.slice(0, 7);
        const text = [
          `Commit ${shortSha} creado en ${input.owner}/${input.repo} (rama ${commit.branch}): "${commit.message}"`,
          `Archivo: ${commit.path}`,
          `URL: ${commit.url}`,
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (error) {
        logger.error("Falló create_commit", {
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
