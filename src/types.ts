export interface RepositorySummary {
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  url: string;
  defaultBranch: string;
}

export interface IssueSummary {
  number: number;
  title: string;
  state: string;
  author: string;
  url: string;
  createdAt: string;
}

export interface CommitResult {
  sha: string;
  message: string;
  url: string;
  path: string;
  branch: string;
}

export interface RepositoryContext {
  owner: string;
  repo: string;
}

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "GITHUB_API_ERROR"
  | "NETWORK_ERROR"
  | "RATE_LIMIT_ERROR";
