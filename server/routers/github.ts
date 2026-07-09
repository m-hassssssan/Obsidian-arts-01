import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "../middleware";
import * as gh from "../lib/github";

export const githubRouter = createRouter({
  // Returns integration status without leaking the token.
  getStatus: adminQuery.query(async () => {
    const s = await gh.getStatus();
    return s;
  }),

  getRepo: adminQuery.query(async () => {
    const repo = await gh.getRepo();
    if (!repo) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Repository not found or not accessible",
      });
    }
    return repo;
  }),

  recentActivity: adminQuery.query(async () => {
    try {
      return await gh.recentActivity();
    } catch (e) {
      if (e instanceof gh.GitHubError) {
        if (e.status === 429) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: e.message,
          });
        }
        if (e.status === 404) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Repository not found or not accessible",
          });
        }
      }
      throw e;
    }
  }),

  listCommits: adminQuery
    .input(
      z
        .object({
          perPage: z.number().min(1).max(100).default(20),
          sha: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      try {
        return (await gh.listCommits({
          per_page: input?.perPage ?? 20,
          sha: input?.sha,
        })) ?? [];
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
          if (e.status === 404) {
            throw new TRPCError({ code: "NOT_FOUND", message: e.message });
          }
        }
        throw e;
      }
    }),

  getCommit: adminQuery
    .input(z.object({ sha: z.string().min(7) }))
    .query(async ({ input }) => {
      try {
        return await gh.getCommit(input.sha);
      } catch (e) {
        if (e instanceof gh.GitHubError && e.status === 404) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Commit not found" });
        }
        throw e;
      }
    }),

  listBranches: adminQuery.query(async () => {
    try {
      return (await gh.listBranches()) ?? [];
    } catch (e) {
      if (e instanceof gh.GitHubError && e.status === 429) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
      }
      throw e;
    }
  }),

  listIssues: adminQuery
    .input(
      z
        .object({
          state: z.enum(["open", "closed", "all"]).default("open"),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      try {
        return (await gh.listIssues({ state: input?.state ?? "open" })) ?? [];
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
          if (e.status === 404) {
            throw new TRPCError({ code: "NOT_FOUND", message: e.message });
          }
        }
        throw e;
      }
    }),

  getIssue: adminQuery
    .input(z.object({ number: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const issue = await gh.getIssue(input.number);
        if (!issue) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });
        }
        const comments = (await gh.listIssueComments(input.number)) ?? [];
        return { issue, comments };
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
          if (e.status === 404) {
            throw new TRPCError({ code: "NOT_FOUND", message: e.message });
          }
        }
        throw e;
      }
    }),

  createIssue: adminQuery
    .input(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().max(60000).optional(),
        labels: z.array(z.string()).max(20).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await gh.createIssue(input);
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 412) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: e.message,
            });
          }
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
          if (e.status === 404) {
            throw new TRPCError({ code: "NOT_FOUND", message: e.message });
          }
        }
        throw e;
      }
    }),

  updateIssue: adminQuery
    .input(
      z.object({
        number: z.number().int().positive(),
        state: z.enum(["open", "closed"]).optional(),
        title: z.string().min(1).max(200).optional(),
        body: z.string().max(60000).optional(),
        labels: z.array(z.string()).max(20).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { number, ...rest } = input;
      try {
        return await gh.updateIssue(number, rest);
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 412) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: e.message,
            });
          }
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
        }
        throw e;
      }
    }),

  commentOnIssue: adminQuery
    .input(
      z.object({
        number: z.number().int().positive(),
        body: z.string().min(1).max(60000),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await gh.commentOnIssue(input.number, input.body);
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 412) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: e.message,
            });
          }
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
        }
        throw e;
      }
    }),

  listPulls: adminQuery
    .input(
      z
        .object({
          state: z.enum(["open", "closed", "all"]).default("open"),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      try {
        return (await gh.listPulls({ state: input?.state ?? "open" })) ?? [];
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
          if (e.status === 404) {
            throw new TRPCError({ code: "NOT_FOUND", message: e.message });
          }
        }
        throw e;
      }
    }),

  getPull: adminQuery
    .input(z.object({ number: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const p = await gh.getPull(input.number);
        if (!p) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pull request not found" });
        }
        return p;
      } catch (e) {
        if (e instanceof gh.GitHubError && e.status === 429) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
        }
        throw e;
      }
    }),

  listReleases: adminQuery.query(async () => {
    try {
      return (await gh.listReleases()) ?? [];
    } catch (e) {
      if (e instanceof gh.GitHubError && e.status === 429) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
      }
      throw e;
    }
  }),

  // Returns the README's decoded text + sha (for the editor's update flow).
  getReadme: adminQuery.query(async () => {
    try {
      const raw = await gh.getReadme();
      if (!raw) {
        throw new TRPCError({ code: "NOT_FOUND", message: "README not found" });
      }
      return {
        name: raw.name,
        path: raw.path,
        sha: raw.sha,
        size: raw.size,
        htmlUrl: raw.html_url,
        text: gh.decodeBase64(raw.content),
      };
    } catch (e) {
      if (e instanceof gh.GitHubError) {
        if (e.status === 429) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
        }
        if (e.status === 404) {
          throw new TRPCError({ code: "NOT_FOUND", message: "README not found" });
        }
      }
      throw e;
    }
  }),

  syncReadme: adminQuery
    .input(
      z.object({
        content: z.string().min(1).max(1_000_000),
        message: z.string().min(1).max(200).default("Update README from admin panel"),
        sha: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const r = await gh.pushFile({
          path: "README.md",
          content: input.content,
          message: input.message,
          sha: input.sha,
        });
        return r;
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 412) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: e.message,
            });
          }
          if (e.status === 409) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "README was updated by someone else. Reload to get the latest sha and try again.",
            });
          }
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
        }
        throw e;
      }
    }),

  listFiles: adminQuery
    .input(z.object({ path: z.string().default("") }).optional())
    .query(async ({ input }) => {
      try {
        return (await gh.listFiles(input?.path ?? "")) ?? [];
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 404) {
            return [];
          }
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
        }
        throw e;
      }
    }),

  getFile: adminQuery
    .input(z.object({ path: z.string().min(1).max(500) }))
    .query(async ({ input }) => {
      try {
        const raw = await gh.getFile(input.path);
        if (!raw) {
          throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
        }
        // Binary detection: if the decoded content contains NULs, we have a
        // binary file. Skip decoding and return base64 as-is.
        const decoded = gh.decodeBase64(raw.content);
        const isBinary = decoded.includes(" ");
        return {
          name: raw.name,
          path: raw.path,
          sha: raw.sha,
          size: raw.size,
          htmlUrl: raw.html_url,
          isBinary,
          text: isBinary ? null : decoded,
          base64: isBinary ? raw.content.replace(/\s/g, "") : null,
        };
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 404) {
            throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
          }
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
        }
        throw e;
      }
    }),

  pushFile: adminQuery
    .input(
      z.object({
        path: z.string().min(1).max(500),
        content: z.string().min(0).max(1_000_000),
        message: z.string().min(1).max(200),
        sha: z.string().min(1).optional(),
        branch: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await gh.pushFile(input);
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 412) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: e.message,
            });
          }
          if (e.status === 409) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "File was updated by someone else. Reload and retry.",
            });
          }
          if (e.status === 429) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: e.message });
          }
        }
        throw e;
      }
    }),

  dispatchWebhook: adminQuery
    .input(
      z.object({
        eventType: z.string().min(1).max(100),
        clientPayload: z.unknown().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await gh.dispatchWebhook(input.eventType, input.clientPayload);
      } catch (e) {
        if (e instanceof gh.GitHubError) {
          if (e.status === 412) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: e.message,
            });
          }
          if (e.status === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "No webhook registered for this event. Configure a webhook in repo settings first.",
            });
          }
          if (e.status === 422) {
            throw new TRPCError({
              code: "UNPROCESSABLE_CONTENT",
              message: "Webhook dispatch payload rejected by GitHub.",
            });
          }
        }
        throw e;
      }
    }),
});
