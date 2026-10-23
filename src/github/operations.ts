import type {
  CreateCommitInput,
  CreateIssueInput,
  CreateRepositoryInput,
  ListIssuesInput,
  ListRepositoriesInput,
} from "../schemas/index.js";
import type {
  CommitResult,
  IssueSummary,
  RepositorySummary,
} from "../types.js";
import { GitHubAPIError } from "../errors/index.js";
import { logger } from "../utils/logging.js";
import { withRetry } from "../utils/retry.js";
import { getOctokit, mapGitHubError } from "./client.js";

interface RawRepository {
  name: string;
  full_name: string;
  description?: string | null;
  private: boolean;
  html_url: string;
  default_branch?: string;
}

interface RawIssue {
  number: number;
  title: string;
  state: string;
  user?: { login: string } | null;
  html_url: string;
  created_at?: string | null;
}

interface RawErrorLike {
  status?: number;
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as RawErrorLike).status === 404
  );
}

function mapRepository(repository: RawRepository): RepositorySummary {
  return {
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description ?? null,
    private: repository.private,
    url: repository.html_url,
    defaultBranch: repository.default_branch ?? "main",
  };
}

function mapIssue(issue: RawIssue): IssueSummary {
  return {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    author: issue.user?.login ?? "desconocido",
    url: issue.html_url,
    createdAt: issue.created_at ?? "",
  };
}

export async function createRepository(
  input: CreateRepositoryInput,
): Promise<RepositorySummary> {
  const octokit = getOctokit();
  logger.debug("Creando repositorio", { name: input.name });

  try {
    return await withRetry(async () => {
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: input.name,
        description: input.description,
        private: input.private ?? false,
      });
      return mapRepository(data);
    });
  } catch (error) {
    mapGitHubError(error, { repo: input.name });
  }
}

export async function listRepositories(
  input: ListRepositoriesInput,
): Promise<RepositorySummary[]> {
  const octokit = getOctokit();
  logger.debug("Listando repositorios", {
    visibility: input.visibility ?? "all",
  });

  try {
    return await withRetry(async () => {
      const { data } = await octokit.repos.listForAuthenticatedUser({
        visibility: input.visibility ?? "all",
        per_page: input.perPage ?? 30,
        sort: "updated",
      });
      return data.map(mapRepository);
    });
  } catch (error) {
    mapGitHubError(error, {});
  }
}

export async function createIssue(
  input: CreateIssueInput,
): Promise<IssueSummary> {
  const octokit = getOctokit();
  logger.debug("Creando issue", {
    owner: input.owner,
    repo: input.repo,
    title: input.title,
  });

  try {
    return await withRetry(async () => {
      const { data } = await octokit.issues.create({
        owner: input.owner,
        repo: input.repo,
        title: input.title,
        body: input.body,
      });
      return mapIssue(data);
    });
  } catch (error) {
    mapGitHubError(error, { owner: input.owner, repo: input.repo });
  }
}

export async function listIssues(
  input: ListIssuesInput,
): Promise<IssueSummary[]> {
  const octokit = getOctokit();
  logger.debug("Listando issues", {
    owner: input.owner,
    repo: input.repo,
    state: input.state ?? "open",
  });

  try {
    return await withRetry(async () => {
      const { data } = await octokit.issues.listForRepo({
        owner: input.owner,
        repo: input.repo,
        state: input.state ?? "open",
        per_page: input.perPage ?? 30,
      });
      return data
        .filter((issue) => !("pull_request" in issue) || issue.pull_request === undefined)
        .map(mapIssue);
    });
  } catch (error) {
    mapGitHubError(error, { owner: input.owner, repo: input.repo });
  }
}

export async function createCommit(
  input: CreateCommitInput,
): Promise<CommitResult> {
  const octokit = getOctokit();
  logger.debug("Creando commit", {
    owner: input.owner,
    repo: input.repo,
    path: input.path,
  });

  try {
    return await withRetry(async () => {
      const branch =
        input.branch ??
        (
          await octokit.repos.get({
            owner: input.owner,
            repo: input.repo,
          })
        ).data.default_branch;

      let existingSha: string | undefined;
      try {
        const { data } = await octokit.repos.getContent({
          owner: input.owner,
          repo: input.repo,
          path: input.path,
          ref: branch,
        });

        if (Array.isArray(data)) {
          throw new GitHubAPIError(
            `La ruta '${input.path}' corresponde a un directorio, no a un archivo.`,
            422,
            { context: { owner: input.owner, repo: input.repo, path: input.path } },
          );
        }

        existingSha = data.sha;
      } catch (error) {
        if (!isNotFound(error)) {
          throw error;
        }
      }

      const { data } = await octokit.repos.createOrUpdateFileContents({
        owner: input.owner,
        repo: input.repo,
        path: input.path,
        message: input.message,
        content: Buffer.from(input.content, "utf8").toString("base64"),
        branch,
        sha: existingSha,
      });

      return {
        sha: data.commit.sha ?? "",
        message: data.commit.message ?? input.message,
        url: data.commit.html_url ?? "",
        path: input.path,
        branch,
      };
    });
  } catch (error) {
    mapGitHubError(error, {
      owner: input.owner,
      repo: input.repo,
      path: input.path,
    });
  }
}
