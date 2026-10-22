import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerCreateRepositoryTool } from "./tools/create-repository.js";
import { registerCreateIssueTool } from "./tools/create-issue.js";
import { registerListRepositoriesTool } from "./tools/list-repositories.js";
import { registerCreateCommitTool } from "./tools/create-commit.js";
import { registerListIssuesTool } from "./tools/list-issues.js";

const SERVER_NAME = "github-mcp-server";
const SERVER_VERSION = "0.1.0";

export function createServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Servidor MCP para automatizar operaciones de GitHub. Usa las tools disponibles solo cuando la petición del usuario corresponda a la acción descrita.",
    },
  );

  registerCreateRepositoryTool(server);
  registerCreateIssueTool(server);
  registerListRepositoriesTool(server);
  registerCreateCommitTool(server);
  registerListIssuesTool(server);

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error(
    `[${SERVER_NAME}] v${SERVER_VERSION} iniciado. Comunicación por stdio.`,
  );
}

const entryPoint = process.argv[1];
const isMain =
  entryPoint !== undefined &&
  import.meta.url === pathToFileURL(entryPoint).href;

if (isMain) {
  main().catch((error: unknown) => {
    console.error(`[${SERVER_NAME}] Error fatal al iniciar:`, error);
    process.exit(1);
  });
}
