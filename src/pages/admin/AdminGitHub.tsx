import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  Github,
  GitCommit,
  GitPullRequest,
  CircleDot,
  Tag,
  BookOpen,
  FileText,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { ReactNode } from "react";

type Tab = "repo" | "commits" | "issues" | "pulls" | "releases" | "readme" | "files";

const TABS: { value: Tab; label: string; icon: ReactNode }[] = [
  { value: "repo", label: "Overview", icon: <Github size={14} /> },
  { value: "commits", label: "Commits", icon: <GitCommit size={14} /> },
  { value: "issues", label: "Issues", icon: <CircleDot size={14} /> },
  { value: "pulls", label: "Pulls", icon: <GitPullRequest size={14} /> },
  { value: "releases", label: "Releases", icon: <Tag size={14} /> },
  { value: "readme", label: "README", icon: <BookOpen size={14} /> },
  { value: "files", label: "Files", icon: <FileText size={14} /> },
];

export default function AdminGitHub() {
  const [tab, setTab] = useState<Tab>("repo");
  const status = trpc.github.getStatus.useQuery();

  return (
    <div className="p-6 md:p-10 space-y-6">
      <Header status={status.data} />
      <Tabs tab={tab} setTab={setTab} />
      {tab === "repo" && <Overview />}
      {tab === "commits" && <Commits />}
      {tab === "issues" && <Issues />}
      {tab === "pulls" && <Pulls />}
      {tab === "releases" && <Releases />}
      {tab === "readme" && <Readme tokenConfigured={!!status.data?.configured} />}
      {tab === "files" && <Files tokenConfigured={!!status.data?.configured} />}
    </div>
  );
}

// ───────────────────────── Header ─────────────────────────

type HeaderStatus = {
  configured: boolean;
  owner: string;
  repo: string;
  rateLimit: { remaining: number; reset: number; limit: number } | null;
};

function Header({ status }: { status: HeaderStatus | undefined }) {
  const activity = trpc.github.recentActivity.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="border-y-[3px] border-black bg-white px-6 py-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Github size={28} />
          <div>
            <h2 className="font-oswald text-2xl font-bold uppercase tracking-tight">
              GitHub Integration
            </h2>
            <p className="font-inter text-xs text-[#1a1a1a]/60">
              {status ? (
                <>
                  <a
                    className="underline hover:text-[#FF0004]"
                    href={`https://github.com/${status.owner}/${status.repo}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {status.owner}/{status.repo}
                  </a>{" "}
                  ·{" "}
                  {status.configured ? (
                    <span className="text-green-700 font-bold">TOKEN CONFIGURED</span>
                  ) : (
                    <span className="text-[#FF0004] font-bold">
                      READ-ONLY (no token)
                    </span>
                  )}
                </>
              ) : (
                "Loading status…"
              )}
            </p>
          </div>
        </div>

        {activity.data?.repo && (
          <div className="flex flex-wrap items-center gap-4 font-oswald text-[10px] font-bold uppercase tracking-widest">
            <Stat label="Stars" value={activity.data.repo.stargazers_count} />
            <Stat label="Forks" value={activity.data.repo.forks_count} />
            <Stat label="Open Issues" value={activity.data.repo.open_issues_count} />
            <Stat label="Watchers" value={activity.data.repo.watchers_count} />
          </div>
        )}
      </div>

      {activity.error && (
        <div className="mt-3 flex items-center gap-2 border-[2px] border-[#FF0004] bg-red-50 px-3 py-2 font-inter text-xs text-[#FF0004]">
          <AlertCircle size={14} />
          <span>
            GitHub request failed:{" "}
            {activity.error.message ?? "Unknown error"}. Check GITHUB_TOKEN and
            repo visibility.
          </span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-[2px] border-black px-3 py-1.5">
      <div className="text-[9px] text-[#1a1a1a]/50">{label}</div>
      <div className="text-sm font-bold text-[#1a1a1a]">{value}</div>
    </div>
  );
}

// ───────────────────────── Tabs ─────────────────────────

function Tabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="flex flex-wrap gap-0 border-b-[3px] border-black">
      {TABS.map((t) => (
        <button
          key={t.value}
          onClick={() => setTab(t.value)}
          className={`flex items-center gap-2 px-4 py-2 font-oswald text-[11px] font-bold uppercase tracking-widest border-x-[2px] border-t-[2px] -mb-[3px] ${
            tab === t.value
              ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
              : "bg-white text-[#1a1a1a] border-black hover:bg-[#F9FF00]/40"
          }`}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// ───────────────────────── Overview ─────────────────────────

function Overview() {
  const activity = trpc.github.recentActivity.useQuery();
  const utils = trpc.useUtils();

  const dispatch = trpc.github.dispatchWebhook.useMutation({
    onSuccess: () => toast.success("Webhook dispatched"),
    onError: (e) => toast.error(e.message),
  });
  const [eventType, setEventType] = useState("manual-trigger");

  if (activity.isLoading) return <Spinner />;
  if (activity.error) {
    return (
      <Banner kind="error">
        {activity.error.message ?? "Failed to load repository"}
      </Banner>
    );
  }
  if (!activity.data) return null;
  const { repo, latestCommits, openIssueCount, openPullCount, latestRelease } =
    activity.data;
  if (!repo) {
    return <Banner kind="error">Repository not accessible.</Banner>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card title="Repository" className="lg:col-span-2">
        <Row k="Name" v={repo.full_name} mono />
        <Row k="Description" v={repo.description || "—"} />
        <Row k="Default branch" v={repo.default_branch} mono />
        <Row k="Language" v={repo.language || "—"} />
        <Row k="License" v={repo.license?.spdx_id || "—"} mono />
        <Row k="Visibility" v={repo.private ? "Private" : "Public"} />
        <Row k="Created" v={new Date(repo.created_at).toLocaleString()} />
        <Row k="Last push" v={new Date(repo.pushed_at).toLocaleString()} />
        <div className="pt-3">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            className="btn-brutal btn-brutal-black inline-flex items-center gap-2 text-xs"
          >
            <ExternalLink size={12} /> OPEN ON GITHUB
          </a>
        </div>
      </Card>

      <div className="space-y-4">
        <Card title="Counts">
          <Row k="Open issues" v={openIssueCount} />
          <Row k="Open PRs" v={openPullCount} />
          <Row
            k="Latest release"
            v={
              latestRelease
                ? `${latestRelease.tag_name}${latestRelease.prerelease ? " (pre)" : ""}`
                : "—"
            }
            mono
          />
        </Card>
        <Card title="Dispatch webhook">
          <p className="font-inter text-xs text-[#1a1a1a]/60 mb-2">
            Trigger a repository_dispatch event. Requires a webhook to be
            registered in repo settings.
          </p>
          <div className="flex gap-2">
            <input
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="event_type"
              className="flex-1 border-[2px] border-black px-2 py-1 font-mono text-xs"
            />
            <button
              disabled={dispatch.isPending}
              onClick={() => dispatch.mutate({ eventType })}
              className="btn-brutal btn-brutal-yellow text-xs disabled:opacity-40"
            >
              {dispatch.isPending ? <Loader2 size={12} className="animate-spin" /> : "SEND"}
            </button>
          </div>
        </Card>
      </div>

      <Card title="Latest commits" className="lg:col-span-3">
        {latestCommits.length === 0 && (
          <p className="font-inter text-xs text-[#1a1a1a]/50">No commits.</p>
        )}
        <ul className="space-y-2">
          {latestCommits.map((c) => (
            <li
              key={c.sha}
              className="border-b-[1px] border-black/10 pb-2 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <code className="font-mono text-[10px] bg-[#1a1a1a] text-[#F9FF00] px-1.5 py-0.5">
                  {c.sha.slice(0, 7)}
                </code>
                <div className="flex-1 min-w-0">
                  <div className="font-inter text-xs truncate">
                    {firstLine(c.commit.message)}
                  </div>
                  <div className="font-inter text-[10px] text-[#1a1a1a]/50">
                    {c.commit.author.name} ·{" "}
                    {new Date(c.commit.author.date).toLocaleString()}
                  </div>
                </div>
                <a
                  href={c.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1a1a1a]/40 hover:text-[#FF0004]"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </li>
          ))}
        </ul>
        <div className="pt-3">
          <button
            onClick={() => utils.github.recentActivity.invalidate()}
            className="btn-brutal btn-brutal-black text-xs inline-flex items-center gap-1"
          >
            <RefreshCw size={12} /> REFRESH
          </button>
        </div>
      </Card>
    </div>
  );
}

// ───────────────────────── Commits ─────────────────────────

function Commits() {
  const commits = trpc.github.listCommits.useQuery({ perPage: 30 });
  const [openSha, setOpenSha] = useState<string | null>(null);
  const detail = trpc.github.getCommit.useQuery(
    { sha: openSha ?? "" },
    { enabled: !!openSha },
  );

  if (commits.isLoading) return <Spinner />;
  if (commits.error) {
    return <Banner kind="error">{commits.error.message}</Banner>;
  }
  if (!commits.data) return null;

  return (
    <div className="border-[3px] border-black bg-white">
      <table className="w-full">
        <thead className="bg-[#1a1a1a] text-white">
          <tr>
            <Th>SHA</Th>
            <Th>Message</Th>
            <Th>Author</Th>
            <Th>Date</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {commits.data.map((c) => (
            <>
              <tr
                key={c.sha}
                onClick={() =>
                  setOpenSha((prev) => (prev === c.sha ? null : c.sha))
                }
                className="border-b-[1px] border-black/10 cursor-pointer hover:bg-[#F9FF00]/20"
              >
                <Td>
                  <code className="font-mono text-[10px] bg-[#1a1a1a] text-[#F9FF00] px-1.5 py-0.5">
                    {c.sha.slice(0, 7)}
                  </code>
                </Td>
                <Td>
                  <div className="font-inter text-xs truncate max-w-md">
                    {firstLine(c.commit.message)}
                  </div>
                </Td>
                <Td>
                  <div className="font-inter text-xs">
                    {c.commit.author.name}
                  </div>
                </Td>
                <Td>
                  <div className="font-inter text-[10px] text-[#1a1a1a]/60">
                    {new Date(c.commit.author.date).toLocaleString()}
                  </div>
                </Td>
                <Td>
                  <a
                    href={c.html_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#1a1a1a]/40 hover:text-[#FF0004]"
                  >
                    <ExternalLink size={12} />
                  </a>
                </Td>
              </tr>
              {openSha === c.sha && (
                <tr className="bg-[#fafafa]">
                  <td colSpan={5} className="p-4">
                    {detail.isLoading ? (
                      <Spinner small />
                    ) : detail.data ? (
                      <div className="space-y-2">
                        <div className="font-inter text-xs whitespace-pre-wrap border-[2px] border-black bg-white p-3 max-h-64 overflow-auto">
                          {detail.data.commit.message}
                        </div>
                        <div className="font-inter text-[10px] text-[#1a1a1a]/60">
                          {detail.data.parents.length} parent(s) ·{" "}
                          <a
                            href={detail.data.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-[#FF0004]"
                          >
                            view on GitHub
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="font-inter text-xs">No detail.</p>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────────── Issues ─────────────────────────

function Issues() {
  const issues = trpc.github.listIssues.useQuery({ state: "open" });
  const utils = trpc.useUtils();
  const [openNumber, setOpenNumber] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const detail = trpc.github.getIssue.useQuery(
    { number: openNumber ?? 0 },
    { enabled: !!openNumber },
  );

  const create = trpc.github.createIssue.useMutation({
    onSuccess: (i) => {
      if (!i) return;
      toast.success(`Created #${i.number}`);
      setShowNew(false);
      setNewTitle("");
      setNewBody("");
      utils.github.listIssues.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const close = trpc.github.updateIssue.useMutation({
    onSuccess: () => {
      toast.success("Issue closed");
      utils.github.listIssues.invalidate();
      utils.github.getIssue.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const comment = trpc.github.commentOnIssue.useMutation({
    onSuccess: () => {
      toast.success("Comment posted");
      utils.github.getIssue.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const [commentBody, setCommentBody] = useState("");

  if (issues.isLoading) return <Spinner />;
  if (issues.error) return <Banner kind="error">{issues.error.message}</Banner>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-inter text-sm text-[#1a1a1a]/60">
          {issues.data?.length ?? 0} open issue
          {(issues.data?.length ?? 0) === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => setShowNew((s) => !s)}
          className="btn-brutal btn-brutal-yellow text-xs"
        >
          {showNew ? "CANCEL" : "+ NEW ISSUE"}
        </button>
      </div>

      {showNew && (
        <Card title="New issue">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            className="w-full border-[2px] border-black px-2 py-1.5 font-inter text-sm mb-2"
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Body (markdown)…"
            rows={6}
            className="w-full border-[2px] border-black px-2 py-1.5 font-inter text-xs"
          />
          <div className="pt-2">
            <button
              disabled={!newTitle.trim() || create.isPending}
              onClick={() =>
                create.mutate({ title: newTitle.trim(), body: newBody || undefined })
              }
              className="btn-brutal btn-brutal-black text-xs disabled:opacity-40"
            >
              {create.isPending ? <Loader2 size={12} className="animate-spin" /> : "CREATE"}
            </button>
          </div>
        </Card>
      )}

      <div className="border-[3px] border-black bg-white">
        <table className="w-full">
          <thead className="bg-[#1a1a1a] text-white">
            <tr>
              <Th>#</Th>
              <Th>Title</Th>
              <Th>Author</Th>
              <Th>Updated</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {issues.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center font-inter text-xs text-[#1a1a1a]/40">
                  No open issues.
                </td>
              </tr>
            )}
            {issues.data?.map((i) => (
              <>
                <tr
                  key={i.number}
                  onClick={() =>
                    setOpenNumber((p) => (p === i.number ? null : i.number))
                  }
                  className="border-b-[1px] border-black/10 cursor-pointer hover:bg-[#F9FF00]/20"
                >
                  <Td>
                    <span className="font-mono text-xs">#{i.number}</span>
                  </Td>
                  <Td>
                    <div className="font-inter text-xs font-medium">{i.title}</div>
                    {i.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {i.labels.map((l) => (
                          <span
                            key={l.id}
                            className="font-oswald text-[9px] font-bold uppercase px-1.5 py-0.5 border-[1px] border-black"
                            style={{ color: `#${l.color}` }}
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <div className="font-inter text-xs">
                      {i.user?.login || "—"}
                    </div>
                  </Td>
                  <Td>
                    <div className="font-inter text-[10px] text-[#1a1a1a]/60">
                      {new Date(i.updated_at).toLocaleDateString()}
                    </div>
                  </Td>
                  <Td>
                    <a
                      href={i.html_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#1a1a1a]/40 hover:text-[#FF0004]"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </Td>
                </tr>
                {openNumber === i.number && detail.data && (
                  <tr className="bg-[#fafafa]">
                    <td colSpan={5} className="p-4">
                      <div className="space-y-3">
                        {detail.data.issue.body && (
                          <pre className="font-inter text-xs whitespace-pre-wrap border-[2px] border-black bg-white p-3 max-h-64 overflow-auto">
                            {detail.data.issue.body}
                          </pre>
                        )}
                        {detail.data.comments.length > 0 && (
                          <div className="space-y-2">
                            <div className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50">
                              {detail.data.comments.length} comment
                              {detail.data.comments.length === 1 ? "" : "s"}
                            </div>
                            {detail.data.comments.map((c) => (
                              <div
                                key={c.id}
                                className="border-[1px] border-black/20 bg-white p-2"
                              >
                                <div className="font-oswald text-[9px] font-bold uppercase tracking-widest text-[#1a1a1a]/50 mb-1">
                                  {c.user?.login} ·{" "}
                                  {new Date(c.created_at).toLocaleString()}
                                </div>
                                <div className="font-inter text-xs whitespace-pre-wrap">
                                  {c.body}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="border-t-[2px] border-black/20 pt-3 space-y-2">
                          <textarea
                            value={commentBody}
                            onChange={(e) => setCommentBody(e.target.value)}
                            placeholder="Write a comment…"
                            rows={3}
                            className="w-full border-[2px] border-black px-2 py-1.5 font-inter text-xs"
                          />
                          <div className="flex gap-2">
                            <button
                              disabled={
                                !commentBody.trim() || comment.isPending
                              }
                              onClick={() =>
                                comment.mutate(
                                  {
                                    number: i.number,
                                    body: commentBody.trim(),
                                  },
                                  { onSuccess: () => setCommentBody("") },
                                )
                              }
                              className="btn-brutal btn-brutal-black text-xs disabled:opacity-40"
                            >
                              {comment.isPending ? <Loader2 size={12} className="animate-spin" /> : "COMMENT"}
                            </button>
                            {i.state === "open" && (
                              <button
                                disabled={close.isPending}
                                onClick={() =>
                                  close.mutate({ number: i.number, state: "closed" })
                                }
                                className="btn-brutal btn-brutal-yellow text-xs disabled:opacity-40"
                              >
                                CLOSE
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────── Pulls ─────────────────────────

function Pulls() {
  const pulls = trpc.github.listPulls.useQuery({ state: "open" });
  const utils = trpc.useUtils();
  const [openNumber, setOpenNumber] = useState<number | null>(null);
  const detail = trpc.github.getPull.useQuery(
    { number: openNumber ?? 0 },
    { enabled: !!openNumber },
  );

  const close = trpc.github.dispatchWebhook.useMutation({
    onSuccess: () => toast.success("Webhook dispatched"),
    onError: (e) => toast.error(e.message),
  });

  if (pulls.isLoading) return <Spinner />;
  if (pulls.error) return <Banner kind="error">{pulls.error.message}</Banner>;

  return (
    <div className="border-[3px] border-black bg-white">
      <table className="w-full">
        <thead className="bg-[#1a1a1a] text-white">
          <tr>
            <Th>#</Th>
            <Th>Title</Th>
            <Th>Author</Th>
            <Th>Branch</Th>
            <Th>Updated</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {pulls.data?.length === 0 && (
            <tr>
              <td colSpan={6} className="p-12 text-center font-inter text-xs text-[#1a1a1a]/40">
                No open pull requests.
              </td>
            </tr>
          )}
          {pulls.data?.map((p) => (
            <>
              <tr
                key={p.number}
                onClick={() =>
                  setOpenNumber((prev) => (prev === p.number ? null : p.number))
                }
                className="border-b-[1px] border-black/10 cursor-pointer hover:bg-[#F9FF00]/20"
              >
                <Td>
                  <span className="font-mono text-xs">#{p.number}</span>
                </Td>
                <Td>
                  <div className="font-inter text-xs">{p.title}</div>
                  {p.draft && (
                    <span className="font-oswald text-[9px] font-bold uppercase text-[#1a1a1a]/50">
                      DRAFT
                    </span>
                  )}
                </Td>
                <Td>
                  <div className="font-inter text-xs">{p.user?.login || "—"}</div>
                </Td>
                <Td>
                  <code className="font-mono text-[10px]">
                    {p.head.ref} → {p.base.ref}
                  </code>
                </Td>
                <Td>
                  <div className="font-inter text-[10px] text-[#1a1a1a]/60">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </div>
                </Td>
                <Td>
                  <a
                    href={p.html_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#1a1a1a]/40 hover:text-[#FF0004]"
                  >
                    <ExternalLink size={12} />
                  </a>
                </Td>
              </tr>
              {openNumber === p.number && detail.data && (
                <tr className="bg-[#fafafa]">
                  <td colSpan={6} className="p-4">
                    <div className="space-y-2">
                      {detail.data.body && (
                        <pre className="font-inter text-xs whitespace-pre-wrap border-[2px] border-black bg-white p-3 max-h-64 overflow-auto">
                          {detail.data.body}
                        </pre>
                      )}
                      <button
                        disabled={close.isPending}
                        onClick={() =>
                          close.mutate({
                            eventType: "pull-request-wake",
                            clientPayload: { number: p.number, title: p.title },
                          })
                        }
                        className="btn-brutal btn-brutal-yellow text-xs disabled:opacity-40"
                      >
                        {close.isPending ? <Loader2 size={12} className="animate-spin" /> : "TRIGGER CI"}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      <div className="p-3">
        <button
          onClick={() => utils.github.listPulls.invalidate()}
          className="btn-brutal btn-brutal-black text-xs inline-flex items-center gap-1"
        >
          <RefreshCw size={12} /> REFRESH
        </button>
      </div>
    </div>
  );
}

// ───────────────────────── Releases ─────────────────────────

function Releases() {
  const releases = trpc.github.listReleases.useQuery();
  if (releases.isLoading) return <Spinner />;
  if (releases.error) return <Banner kind="error">{releases.error.message}</Banner>;
  if (!releases.data?.length) {
    return (
      <Banner kind="info">
        No releases yet. Create one on GitHub to see it here.
      </Banner>
    );
  }
  return (
    <div className="space-y-3">
      {releases.data.map((r) => (
        <div key={r.id} className="border-[3px] border-black bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={16} />
            <span className="font-oswald text-base font-bold uppercase">
              {r.tag_name}
            </span>
            {r.name && (
              <span className="font-inter text-xs text-[#1a1a1a]/60">
                {r.name}
              </span>
            )}
            {r.draft && (
              <span className="font-oswald text-[9px] font-bold uppercase border-[1px] border-black px-1">
                DRAFT
              </span>
            )}
            {r.prerelease && (
              <span className="font-oswald text-[9px] font-bold uppercase border-[1px] border-black px-1 bg-[#F9FF00]">
                PRERELEASE
              </span>
            )}
            <a
              href={r.html_url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto text-[#1a1a1a]/40 hover:text-[#FF0004]"
            >
              <ExternalLink size={14} />
            </a>
          </div>
          {r.body && (
            <pre className="font-inter text-xs whitespace-pre-wrap border-t-[1px] border-black/10 pt-2 mt-2 max-h-64 overflow-auto">
              {r.body}
            </pre>
          )}
          <div className="font-inter text-[10px] text-[#1a1a1a]/50 mt-2">
            {r.published_at
              ? `Published ${new Date(r.published_at).toLocaleString()}`
              : `Created ${new Date(r.created_at).toLocaleString()}`}
            {r.author && ` by ${r.author.login}`}
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── README ─────────────────────────

function Readme({ tokenConfigured }: { tokenConfigured: boolean }) {
  const readme = trpc.github.getReadme.useQuery();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("Update README from admin panel");

  const save = trpc.github.syncReadme.useMutation({
    onSuccess: (r) => {
      if (!r) return;
      toast.success(`Committed ${r.commit.sha.slice(0, 7)}`);
      setEditing(false);
      utils.github.getReadme.invalidate();
      utils.github.recentActivity.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (readme.isLoading) return <Spinner />;
  if (readme.error) return <Banner kind="error">{readme.error.message}</Banner>;
  if (!readme.data) return null;

  const startEdit = () => {
    setDraft(readme.data.text);
    setEditing(true);
  };

  return (
    <div className="space-y-3">
      {!tokenConfigured && (
        <Banner kind="warn">
          GITHUB_TOKEN is not configured — the editor is read-only. Set it in
          .env to enable commits.
        </Banner>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-inter text-xs text-[#1a1a1a]/60">
          {readme.data.path} · {(readme.data.size / 1024).toFixed(1)} KB ·{" "}
          <code className="font-mono text-[10px]">{readme.data.sha.slice(0, 7)}</code>
        </p>
        <div className="flex gap-2">
          {!editing ? (
            <button
              onClick={startEdit}
              disabled={!tokenConfigured}
              className="btn-brutal btn-brutal-black text-xs disabled:opacity-40"
            >
              EDIT
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="btn-brutal btn-brutal-black text-xs"
              >
                CANCEL
              </button>
              <button
                disabled={save.isPending}
                onClick={() =>
                  save.mutate({
                    content: draft,
                    message,
                    sha: readme.data.sha,
                  })
                }
                className="btn-brutal btn-brutal-yellow text-xs disabled:opacity-40"
              >
                {save.isPending ? <Loader2 size={12} className="animate-spin" /> : "COMMIT"}
              </button>
            </>
          )}
          <a
            href={readme.data.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-brutal btn-brutal-black text-xs inline-flex items-center gap-1"
          >
            <ExternalLink size={12} /> GITHUB
          </a>
        </div>
      </div>

      {editing && (
        <div className="space-y-2 border-[3px] border-black bg-white p-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Commit message"
            className="w-full border-[2px] border-black px-2 py-1.5 font-inter text-sm"
          />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={20}
            className="w-full border-[2px] border-black px-2 py-1.5 font-mono text-xs"
          />
        </div>
      )}

      {!editing && (
        <pre className="border-[3px] border-black bg-white p-4 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-[70vh]">
          {readme.data.text}
        </pre>
      )}
    </div>
  );
}

// ───────────────────────── Files ─────────────────────────

function Files({ tokenConfigured }: { tokenConfigured: boolean }) {
  const [path, setPath] = useState("");
  const [viewing, setViewing] = useState<{
    path: string;
    text: string | null;
    base64: string | null;
    isBinary: boolean;
    size: number;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [sha, setSha] = useState("");
  const [message, setMessage] = useState("");
  const utils = trpc.useUtils();

  const listing = trpc.github.listFiles.useQuery({ path });
  const file = trpc.github.getFile.useQuery(
    { path: viewing?.path ?? "" },
    { enabled: !!viewing },
  );

  // Sync sha + default commit message from the loaded file
  useEffect(() => {
    if (!file.data) return;
    if (!file.data.isBinary) setSha(file.data.sha);
    setMessage(`Update ${file.data.path} from admin panel`);
  }, [file.data]);

  const push = trpc.github.pushFile.useMutation({
    onSuccess: () => {
      toast.success("File pushed");
      setEditing(false);
      utils.github.listFiles.invalidate();
      if (viewing) {
        utils.github.getFile.invalidate({ path: viewing.path });
      }
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card title={`Files at /${path || "root"}`} className="md:col-span-1">
        <div className="flex gap-2 mb-2">
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="subpath (optional)"
            className="flex-1 border-[2px] border-black px-2 py-1 font-mono text-xs"
          />
        </div>
        {listing.isLoading && <Spinner small />}
        {listing.error && <Banner kind="error">{listing.error.message}</Banner>}
        {listing.data && listing.data.length === 0 && (
          <p className="font-inter text-xs text-[#1a1a1a]/50">
            (empty directory)
          </p>
        )}
        <ul className="space-y-1">
          {listing.data?.map((f) => (
            <li key={f.path}>
              <button
                onClick={() => {
                  if (f.type === "dir") {
                    setPath(f.path);
                  } else {
                    setViewing({
                      path: f.path,
                      text: null,
                      base64: null,
                      isBinary: false,
                      size: f.size,
                    });
                    setEditing(false);
                  }
                }}
                className="w-full text-left flex items-center gap-2 px-2 py-1 hover:bg-[#F9FF00]/30 font-inter text-xs"
              >
                {f.type === "dir" ? "📁" : "📄"}{" "}
                <span className="truncate">{f.name}</span>
                <span className="ml-auto font-mono text-[9px] text-[#1a1a1a]/40">
                  {f.size > 0 ? `${(f.size / 1024).toFixed(1)}K` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title={viewing ? viewing.path : "Pick a file"}
        className="md:col-span-2"
      >
        {!viewing && (
          <p className="font-inter text-xs text-[#1a1a1a]/50">
            Click a file in the list to inspect it.
          </p>
        )}
        {viewing && file.isLoading && <Spinner small />}
        {viewing && file.error && (
          <Banner kind="error">{file.error.message}</Banner>
        )}
        {viewing && file.data && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">
              <code className="font-mono">{file.data.sha.slice(0, 7)}</code>
              <span>·</span>
              <span>{(file.data.size / 1024).toFixed(1)} KB</span>
              {file.data.isBinary && (
                <span className="border-[1px] border-black px-1 bg-[#F9FF00]">
                  BINARY
                </span>
              )}
              <span className="ml-auto flex gap-2">
                {!editing && !file.data.isBinary && (
                  <button
                    onClick={() => {
                      setDraft(file.data.text ?? "");
                      setEditing(true);
                    }}
                    disabled={!tokenConfigured}
                    className="text-[10px] border-[2px] border-black px-2 py-0.5 hover:bg-[#F9FF00] disabled:opacity-40"
                  >
                    EDIT
                  </button>
                )}
                <a
                  href={file.data.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] border-[2px] border-black px-2 py-0.5 hover:bg-[#F9FF00]"
                >
                  GITHUB
                </a>
              </span>
            </div>

            {editing ? (
              <div className="space-y-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Commit message"
                  className="w-full border-[2px] border-black px-2 py-1 font-inter text-sm"
                />
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={20}
                  className="w-full border-[2px] border-black px-2 py-1.5 font-mono text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="btn-brutal btn-brutal-black text-xs"
                  >
                    CANCEL
                  </button>
                  <button
                    disabled={push.isPending}
                    onClick={() =>
                      push.mutate({
                        path: viewing.path,
                        content: draft,
                        message,
                        sha,
                      })
                    }
                    className="btn-brutal btn-brutal-yellow text-xs disabled:opacity-40"
                  >
                    {push.isPending ? <Loader2 size={12} className="animate-spin" /> : "COMMIT"}
                  </button>
                </div>
              </div>
            ) : file.data.isBinary ? (
              <BinaryPreview base64={file.data.base64 ?? ""} size={file.data.size} />
            ) : (
              <pre className="border-[2px] border-black bg-[#fafafa] p-3 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-[60vh]">
                {file.data.text}
              </pre>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function BinaryPreview({ base64, size }: { base64: string; size: number }) {
  const [show, setShow] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(base64);
    toast.success("Base64 copied");
  };
  return (
    <div className="border-[2px] border-black p-3 space-y-2">
      <p className="font-inter text-xs text-[#1a1a1a]/60">
        Binary file, {(size / 1024).toFixed(1)} KB. Showing base64.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setShow((s) => !s)}
          className="btn-brutal btn-brutal-black text-xs inline-flex items-center gap-1"
        >
          {show ? <EyeOff size={12} /> : <Eye size={12} />}{" "}
          {show ? "HIDE" : "SHOW"}
        </button>
        <button
          onClick={copy}
          className="btn-brutal btn-brutal-yellow text-xs inline-flex items-center gap-1"
        >
          <Copy size={12} /> COPY
        </button>
      </div>
      {show && (
        <pre className="font-mono text-[10px] break-all whitespace-pre-wrap max-h-64 overflow-auto bg-[#fafafa] p-2 border-[1px] border-black/20">
          {base64}
        </pre>
      )}
    </div>
  );
}

// ───────────────────────── Shared UI ─────────────────────────

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-[3px] border-black bg-white ${className}`}>
      <div className="border-b-[3px] border-black bg-[#1a1a1a] text-white px-4 py-2">
        <span className="font-oswald text-xs font-bold uppercase tracking-widest">
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b-[1px] border-black/10 last:border-b-0">
      <div className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50 w-32 flex-shrink-0">
        {k}
      </div>
      <div
        className={`flex-1 font-inter text-xs break-all ${mono ? "font-mono" : ""}`}
      >
        {v}
      </div>
    </div>
  );
}

function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="text-left px-4 py-2.5 font-oswald text-[10px] font-bold uppercase tracking-widest">
      {children}
    </th>
  );
}

function Td({ children }: { children?: ReactNode }) {
  return <td className="px-4 py-2.5 align-top">{children}</td>;
}

function Spinner({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center ${
        small ? "p-4" : "p-12"
      }`}
    >
      <Loader2
        className="animate-spin text-[#1a1a1a]/40"
        size={small ? 16 : 28}
      />
    </div>
  );
}

function Banner({
  kind,
  children,
}: {
  kind: "error" | "warn" | "info";
  children: ReactNode;
}) {
  const styles: Record<string, string> = {
    error: "border-[#FF0004] bg-red-50 text-[#FF0004]",
    warn: "border-black bg-[#F9FF00] text-[#1a1a1a]",
    info: "border-black bg-[#fafafa] text-[#1a1a1a]/70",
  };
  const Icon: Record<string, ReactNode> = {
    error: <XCircle size={14} />,
    warn: <AlertCircle size={14} />,
    info: <CheckCircle2 size={14} />,
  };
  return (
    <div
      className={`flex items-center gap-2 border-[2px] px-3 py-2 font-inter text-xs ${styles[kind]}`}
    >
      {Icon[kind]} {children}
    </div>
  );
}

function firstLine(s: string) {
  return s.split("\n")[0];
}
