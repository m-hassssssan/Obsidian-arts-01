import { env } from "./env";

const API = "https://api.github.com";

export type GitHubStatus = {
  configured: boolean;
  owner: string;
  repo: string;
  rateLimit: { remaining: number; reset: number; limit: number } | null;
};

export class GitHubError extends Error {
  status: number;
  resetAt: number | null;
  constructor(message: string, status: number, resetAt: number | null = null) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
    this.resetAt = resetAt;
  }
}

type FetchOpts = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  // If true, throw on 404. Default true.
  allow404?: boolean;
  // If true, require a token. Default false.
  requireAuth?: boolean;
};

function headers(token: string | null) {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "obsidian-arts-admin",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function extractRateLimit(res: Response) {
  const remaining = Number(res.headers.get("x-ratelimit-remaining") ?? "");
  const limit = Number(res.headers.get("x-ratelimit-limit") ?? "");
  const reset = Number(res.headers.get("x-ratelimit-reset") ?? "");
  if (Number.isFinite(remaining) && Number.isFinite(limit) && Number.isFinite(reset)) {
    return { remaining, limit, reset: reset * 1000 };
  }
  return null;
}

async function gh<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  const token = env.githubToken || null;
  if (opts.requireAuth && !token) {
    const err = new GitHubError(
      "GITHUB_TOKEN is not configured. Set it in .env to enable writes.",
      412,
    );
    throw err;
  }
  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? "GET",
    headers: headers(token),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const rl = extractRateLimit(res);
  if (res.status === 404 && opts.allow404 !== false) {
    return null;
  }
  if (res.status === 403 && rl && rl.remaining === 0) {
    throw new GitHubError(
      `GitHub rate limit hit. Resets at ${new Date(rl.reset).toISOString()}.`,
      429,
      rl.reset,
    );
  }
  if (!res.ok) {
    let detail = "";
    try {
      const j = (await res.json()) as { message?: string };
      detail = j.message ?? "";
    } catch {
      // ignore
    }
    throw new GitHubError(
      `GitHub ${res.status}: ${detail || res.statusText}`,
      res.status,
      rl?.reset ?? null,
    );
  }
  if (res.status === 204) return null;
  return (await res.json()) as T;
}

// ---------- Types ----------
export type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  topics?: string[];
  license?: { spdx_id: string; name: string } | null;
};

export type Commit = {
  sha: string;
  node_id: string;
  commit: {
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    message: string;
  };
  author: { login: string; avatar_url: string; html_url: string } | null;
  committer: { login: string; avatar_url: string; html_url: string } | null;
  html_url: string;
  parents: { sha: string }[];
};

export type Branch = { name: string; protected: boolean; commit: { sha: string; url: string } };

export type Issue = {
  number: number;
  title: string;
  state: "open" | "closed";
  body: string | null;
  user: { login: string; avatar_url: string; html_url: string } | null;
  labels: { id: number; name: string; color: string }[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  comments: number;
  pull_request?: unknown;
};

export type Comment = {
  id: number;
  body: string;
  user: { login: string; avatar_url: string; html_url: string } | null;
  created_at: string;
  updated_at: string;
  html_url: string;
};

export type Pull = {
  number: number;
  title: string;
  state: "open" | "closed";
  body: string | null;
  user: { login: string; avatar_url: string } | null;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  created_at: string;
  updated_at: string;
  html_url: string;
  draft?: boolean;
  merged_at?: string | null;
};

export type Release = {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  html_url: string;
  author: { login: string; avatar_url: string } | null;
};

export type ContentFile = {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
  url: string;
  html_url: string;
  download_url: string | null;
};

export type TreeEntry = { path: string; mode: string; type: string; sha: string; size?: number };

// ---------- Status ----------
export async function getStatus(): Promise<GitHubStatus> {
  return {
    configured: env.githubConfigured,
    owner: env.githubOwner,
    repo: env.githubRepo,
    rateLimit: null,
  };
}

// ---------- Repo ----------
export async function getRepo() {
  return gh<Repo>(`/repos/${env.githubOwner}/${env.githubRepo}`);
}

// ---------- Commits ----------
export async function listCommits(opts: { per_page?: number; sha?: string } = {}) {
  const params = new URLSearchParams();
  if (opts.per_page) params.set("per_page", String(opts.per_page));
  if (opts.sha) params.set("sha", opts.sha);
  const q = params.toString();
  return gh<Commit[]>(`/repos/${env.githubOwner}/${env.githubRepo}/commits${q ? `?${q}` : ""}`);
}

export async function getCommit(sha: string) {
  return gh<Commit>(`/repos/${env.githubOwner}/${env.githubRepo}/commits/${sha}`);
}

// ---------- Branches ----------
export async function listBranches() {
  return gh<Branch[]>(`/repos/${env.githubOwner}/${env.githubRepo}/branches?per_page=100`);
}

// ---------- Issues ----------
export async function listIssues(opts: { state?: "open" | "closed" | "all"; per_page?: number } = {}) {
  const params = new URLSearchParams();
  params.set("state", opts.state ?? "open");
  if (opts.per_page) params.set("per_page", String(opts.per_page));
  return gh<(Issue & { pull_request?: unknown })[]>(
    `/repos/${env.githubOwner}/${env.githubRepo}/issues?${params.toString()}`,
  ).then((rows) => (rows ?? []).filter((i) => !i.pull_request));
}

export async function getIssue(number: number) {
  return gh<Issue>(`/repos/${env.githubOwner}/${env.githubRepo}/issues/${number}`);
}

export async function createIssue(input: { title: string; body?: string; labels?: string[] }) {
  return gh<Issue>(`/repos/${env.githubOwner}/${env.githubRepo}/issues`, {
    method: "POST",
    body: input,
    requireAuth: true,
  });
}

export async function updateIssue(
  number: number,
  input: { state?: "open" | "closed"; title?: string; body?: string; labels?: string[] },
) {
  return gh<Issue>(`/repos/${env.githubOwner}/${env.githubRepo}/issues/${number}`, {
    method: "PATCH",
    body: input,
    requireAuth: true,
  });
}

export async function commentOnIssue(number: number, body: string) {
  return gh<Comment>(
    `/repos/${env.githubOwner}/${env.githubRepo}/issues/${number}/comments`,
    { method: "POST", body: { body }, requireAuth: true },
  );
}

export async function listIssueComments(number: number) {
  return gh<Comment[]>(
    `/repos/${env.githubOwner}/${env.githubRepo}/issues/${number}/comments`,
  );
}

// ---------- Pulls ----------
export async function listPulls(opts: { state?: "open" | "closed" | "all" } = {}) {
  return gh<Pull[]>(
    `/repos/${env.githubOwner}/${env.githubRepo}/pulls?state=${opts.state ?? "open"}&per_page=50`,
  );
}

export async function getPull(number: number) {
  return gh<Pull>(`/repos/${env.githubOwner}/${env.githubRepo}/pulls/${number}`);
}

// ---------- Releases ----------
export async function listReleases() {
  return gh<Release[]>(`/repos/${env.githubOwner}/${env.githubRepo}/releases?per_page=20`);
}

// ---------- Contents ----------
export async function getReadme() {
  return gh<{
    name: string;
    path: string;
    sha: string;
    size: number;
    content: string; // base64
    encoding: string;
    html_url: string;
  }>(`/repos/${env.githubOwner}/${env.githubRepo}/readme`);
}

export async function getFile(path: string) {
  const ref = encodeURIComponent(path);
  return gh<{
    name: string;
    path: string;
    sha: string;
    size: number;
    content: string;
    encoding: string;
    html_url: string;
  }>(`/repos/${env.githubOwner}/${env.githubRepo}/contents/${ref}`);
}

export async function listFiles(path = "") {
  const ref = encodeURIComponent(path);
  const q = path ? `/${ref}` : "";
  return gh<ContentFile[]>(
    `/repos/${env.githubOwner}/${env.githubRepo}/contents${q}?per_page=100`,
  );
}

// Decoded text from a contents payload
export function decodeBase64(content: string) {
  // GitHub returns base64 with embedded newlines.
  const cleaned = content.replace(/\s/g, "");
  return Buffer.from(cleaned, "base64").toString("utf8");
}

export async function pushFile(input: {
  path: string;
  content: string;
  message: string;
  sha?: string;
  branch?: string;
}) {
  return gh<{
    content: { sha: string; path: string; html_url: string };
    commit: { sha: string; html_url: string };
  }>(`/repos/${env.githubOwner}/${env.githubRepo}/contents/${encodeURIComponent(input.path)}`, {
    method: "PUT",
    body: {
      message: input.message,
      content: Buffer.from(input.content, "utf8").toString("base64"),
      sha: input.sha,
      branch: input.branch,
    },
    requireAuth: true,
  });
}

// ---------- Webhooks ----------
export async function dispatchWebhook(eventType: string, clientPayload?: unknown) {
  // GitHub requires Accept to be the events-preview-ish form for this endpoint,
  // and we still need a token with repo scope.
  const token = env.githubToken || null;
  if (!token) {
    throw new GitHubError("GITHUB_TOKEN is not configured.", 412);
  }
  const res = await fetch(
    `${API}/repos/${env.githubOwner}/${env.githubRepo}/hooks/${eventType}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "obsidian-arts-admin",
      },
      // event_type is required by GitHub; payload is optional
      body: JSON.stringify({ event_type: eventType, client_payload: clientPayload ?? {} }),
    },
  );
  if (!res.ok && res.status !== 204) {
    let detail = "";
    try {
      const j = (await res.json()) as { message?: string };
      detail = j.message ?? "";
    } catch {
      // ignore
    }
    throw new GitHubError(
      `GitHub ${res.status}: ${detail || res.statusText}`,
      res.status,
    );
  }
  return { ok: true, eventType };
}

// ---------- Activity rollup ----------
// A small convenience used by the admin dashboard: latest commit + open issue
// counts. Uses parallel calls but stays under unauth rate limits.
export async function recentActivity() {
  const [repo, commits, issues, pulls, releases] = await Promise.all([
    getRepo(),
    listCommits({ per_page: 5 }),
    listIssues({ state: "open" }),
    listPulls({ state: "open" }),
    listReleases(),
  ]);
  return {
    repo,
    latestCommits: commits ?? [],
    openIssueCount: (issues ?? []).length,
    openPullCount: (pulls ?? []).length,
    latestRelease: (releases ?? [])[0] ?? null,
  };
}
