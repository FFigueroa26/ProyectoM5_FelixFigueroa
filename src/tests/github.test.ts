import { beforeEach, describe, expect, it, vi } from "vitest";

const githubMocks = vi.hoisted(() => {
  const repos = {
    createForAuthenticatedUser: vi.fn(),
    listForAuthenticatedUser: vi.fn(),
    get: vi.fn(),
    getContent: vi.fn(),
    createOrUpdateFileContents: vi.fn(),
  };
  const issues = {
    create: vi.fn(),
    listForRepo: vi.fn(),
  };
  return { repos, issues };
});

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn(function () {
    return { repos: githubMocks.repos, issues: githubMocks.issues };
  }),
}));

import {
  createCommit,
  createIssue,
  createRepository,
  listIssues,
  listRepositories,
} from "../github/operations.js";
import {
  AuthenticationError,
  GitHubAPIError,
  formatErrorForLLM,
} from "../errors/index.js";

beforeEach(() => {
  process.env.GITHUB_TOKEN = "test-token";
});

describe("createRepository", () => {
  it("mapea la respuesta de GitHub al tipo RepositorySummary", async () => {
    githubMocks.repos.createForAuthenticatedUser.mockResolvedValue({
      data: {
        name: "demo",
        full_name: "FFigueroa26/demo",
        description: "repositorio de prueba",
        private: false,
        html_url: "https://github.com/FFigueroa26/demo",
        default_branch: "main",
      },
    });

    const result = await createRepository({ name: "demo" });

    expect(result).toEqual({
      name: "demo",
      fullName: "FFigueroa26/demo",
      description: "repositorio de prueba",
      private: false,
      url: "https://github.com/FFigueroa26/demo",
      defaultBranch: "main",
    });
    expect(githubMocks.repos.createForAuthenticatedUser).toHaveBeenCalledWith({
      name: "demo",
      description: undefined,
      private: false,
    });
  });
});

describe("createIssue", () => {
  it("crea un issue y devuelve sus datos", async () => {
    githubMocks.issues.create.mockResolvedValue({
      data: {
        number: 7,
        title: "Bug en el login",
        state: "open",
        user: { login: "FFigueroa26" },
        html_url: "https://github.com/FFigueroa26/demo/issues/7",
        created_at: "2026-01-01T00:00:00Z",
      },
    });

    const result = await createIssue({
      owner: "FFigueroa26",
      repo: "demo",
      title: "Bug en el login",
    });

    expect(result.number).toBe(7);
    expect(result.author).toBe("FFigueroa26");
    expect(githubMocks.issues.create).toHaveBeenCalledWith({
      owner: "FFigueroa26",
      repo: "demo",
      title: "Bug en el login",
      body: undefined,
    });
  });

  it("convierte un 404 en un mensaje natural para el LLM", async () => {
    githubMocks.issues.create.mockRejectedValue({
      status: 404,
      message: "Not Found",
    });

    let caught: unknown;
    try {
      await createIssue({
        owner: "FFigueroa26",
        repo: "no-existe",
        title: "Bug",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(GitHubAPIError);
    expect(formatErrorForLLM(caught)).toContain(
      "El repositorio FFigueroa26/no-existe no fue encontrado",
    );
  });
});

describe("listRepositories", () => {
  it("lista repositorios con la visibilidad y perPage indicados", async () => {
    githubMocks.repos.listForAuthenticatedUser.mockResolvedValue({
      data: [
        {
          name: "demo",
          full_name: "FFigueroa26/demo",
          description: null,
          private: true,
          html_url: "https://github.com/FFigueroa26/demo",
        },
      ],
    });

    const result = await listRepositories({ visibility: "private", perPage: 5 });

    expect(result).toHaveLength(1);
    expect(result[0]?.private).toBe(true);
    expect(githubMocks.repos.listForAuthenticatedUser).toHaveBeenCalledWith({
      visibility: "private",
      per_page: 5,
      sort: "updated",
    });
  });
});

describe("listIssues", () => {
  it("excluye los pull requests del listado de issues", async () => {
    githubMocks.issues.listForRepo.mockResolvedValue({
      data: [
        {
          number: 1,
          title: "Issue real",
          state: "open",
          user: { login: "FFigueroa26" },
          html_url: "https://github.com/FFigueroa26/demo/issues/1",
          created_at: "2026-01-01T00:00:00Z",
        },
        {
          number: 2,
          title: "Pull request",
          state: "open",
          user: { login: "FFigueroa26" },
          html_url: "https://github.com/FFigueroa26/demo/pull/2",
          created_at: "2026-01-02T00:00:00Z",
          pull_request: { url: "https://api.github.com/pulls/2" },
        },
      ],
    });

    const result = await listIssues({
      owner: "FFigueroa26",
      repo: "demo",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Issue real");
  });
});

describe("credenciales inválidas", () => {
  it("convierte un 401 en AuthenticationError con mensaje natural", async () => {
    githubMocks.repos.listForAuthenticatedUser.mockRejectedValue({
      status: 401,
      message: "Bad credentials",
    });

    let caught: unknown;
    try {
      await listRepositories({});
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AuthenticationError);
    expect(formatErrorForLLM(caught)).toContain(
      "No se pudo autenticar con GitHub",
    );
  });
});

describe("createCommit", () => {
  it("crea un archivo nuevo sin enviar sha", async () => {
    githubMocks.repos.get.mockResolvedValue({
      data: { default_branch: "main" },
    });
    githubMocks.repos.getContent.mockRejectedValue({
      status: 404,
      message: "Not Found",
    });
    githubMocks.repos.createOrUpdateFileContents.mockResolvedValue({
      data: {
        commit: {
          sha: "abc1234def",
          message: "docs: agrega archivo",
          html_url: "https://github.com/FFigueroa26/demo/commit/abc1234def",
        },
      },
    });

    const result = await createCommit({
      owner: "FFigueroa26",
      repo: "demo",
      path: "docs/nuevo.md",
      content: "hola",
      message: "docs: agrega archivo",
    });

    expect(result.branch).toBe("main");
    expect(result.sha).toBe("abc1234def");
    expect(githubMocks.repos.createOrUpdateFileContents).toHaveBeenCalledWith({
      owner: "FFigueroa26",
      repo: "demo",
      path: "docs/nuevo.md",
      message: "docs: agrega archivo",
      content: Buffer.from("hola", "utf8").toString("base64"),
      branch: "main",
      sha: undefined,
    });
  });

  it("actualiza un archivo existente enviando su sha", async () => {
    githubMocks.repos.get.mockResolvedValue({
      data: { default_branch: "main" },
    });
    githubMocks.repos.getContent.mockResolvedValue({
      data: { sha: "sha-existente", type: "file" },
    });
    githubMocks.repos.createOrUpdateFileContents.mockResolvedValue({
      data: {
        commit: {
          sha: "nuevo-sha",
          message: "fix: actualiza",
          html_url: "https://github.com/FFigueroa26/demo/commit/nuevo-sha",
        },
      },
    });

    await createCommit({
      owner: "FFigueroa26",
      repo: "demo",
      path: "README.md",
      content: "contenido",
      message: "fix: actualiza",
      branch: "dev",
    });

    expect(
      githubMocks.repos.createOrUpdateFileContents,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        sha: "sha-existente",
        branch: "dev",
      }),
    );
  });
});
