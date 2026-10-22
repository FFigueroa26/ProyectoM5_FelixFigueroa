import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createCommitSchema } from "../schemas/index.js";

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
      const branch = input.branch ?? "main";
      return {
        content: [
          {
            type: "text",
            text: `Operación pendiente de integración con GitHub: commitear '${input.path}' en ${input.owner}/${input.repo} (rama ${branch}).`,
          },
        ],
      };
    },
  );
}
