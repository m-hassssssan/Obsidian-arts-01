import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import {
  commissions,
  commissionEvents,
  users,
  messages,
} from "@db/schema";
import { and, desc, eq, gte, like, lte, or, sql, count, type SQL } from "drizzle-orm";

const commissionStatusEnum = z.enum([
  "draft",
  "submitted",
  "inReview",
  "approved",
  "inProgress",
  "revision",
  "completed",
  "cancelled",
]);

export const adminRouter = createRouter({
  // Dashboard stats
  getStats: adminQuery.query(async () => {
    const db = getDb();

    // Status counts
    const statusRows = await db
      .select({ status: commissions.status, count: count() })
      .from(commissions)
      .groupBy(commissions.status);
    const statusCounts: Record<string, number> = {};
    for (const r of statusRows) {
      statusCounts[r.status ?? "unknown"] = Number(r.count);
    }

    // Budget counts
    const budgetRows = await db
      .select({ budget: commissions.budget, count: count() })
      .from(commissions)
      .groupBy(commissions.budget);
    const budgetCounts: Record<string, number> = {};
    for (const r of budgetRows) {
      budgetCounts[r.budget ?? "unknown"] = Number(r.count);
    }

    // Project type counts
    const typeRows = await db
      .select({ projectType: commissions.projectType, count: count() })
      .from(commissions)
      .groupBy(commissions.projectType);
    const typeCounts: Record<string, number> = {};
    for (const r of typeRows) {
      typeCounts[r.projectType ?? "unknown"] = Number(r.count);
    }

    const [{ totalCommissions }] = (await db
      .select({ totalCommissions: count() })
      .from(commissions)) as [{ totalCommissions: number }];
    const [{ totalUsers }] = (await db
      .select({ totalUsers: count() })
      .from(users)) as [{ totalUsers: number }];
    const [{ totalMessages }] = (await db
      .select({ totalMessages: count() })
      .from(messages)) as [{ totalMessages: number }];

    // 7-day timeseries
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRows = await db
      .select({
        day: sql<string>`DATE(createdAt)`,
        count: count(),
      })
      .from(commissions)
      .where(gte(commissions.createdAt, since))
      .groupBy(sql`DATE(createdAt)`)
      .orderBy(sql`DATE(createdAt)`);
    const recentActivity = recentRows.map((r) => ({
      day: r.day,
      count: Number(r.count),
    }));

    return {
      totalCommissions: Number(totalCommissions),
      totalUsers: Number(totalUsers),
      totalMessages: Number(totalMessages),
      statusCounts,
      budgetCounts,
      typeCounts,
      recentActivity,
    };
  }),

  // List commissions with filtering, search, pagination
  listCommissions: adminQuery
    .input(
      z
        .object({
          status: z.string().optional(),
          search: z.string().optional(),
          projectType: z.string().optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(200).default(25),
          sortBy: z
            .enum(["createdAt", "updatedAt", "title", "status"])
            .default("createdAt"),
          sortDir: z.enum(["asc", "desc"]).default("desc"),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 25;
      const offset = (page - 1) * limit;
      const conditions: SQL[] = [];
      if (input?.status) conditions.push(eq(commissions.status, input.status as any));
      if (input?.projectType)
        conditions.push(eq(commissions.projectType, input.projectType as any));
      if (input?.search) {
        const q = `%${input.search}%`;
        const orExpr = or(
          like(commissions.title, q),
          like(commissions.description, q),
          like(users.name, q),
          like(users.email, q),
        );
        if (orExpr) conditions.push(orExpr);
      }
      const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn = (() => {
        switch (input?.sortBy) {
          case "title":
            return commissions.title;
          case "status":
            return commissions.status;
          case "updatedAt":
            return commissions.updatedAt;
          case "createdAt":
          default:
            return commissions.createdAt;
        }
      })();
      const orderBy =
        input?.sortDir === "asc" ? sortColumn : desc(sortColumn);

      const rows = await db
        .select({
          id: commissions.id,
          title: commissions.title,
          projectType: commissions.projectType,
          status: commissions.status,
          budget: commissions.budget,
          rightsUsage: commissions.rightsUsage,
          deadline: commissions.deadline,
          createdAt: commissions.createdAt,
          updatedAt: commissions.updatedAt,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
        })
        .from(commissions)
        .innerJoin(users, eq(commissions.userId, users.id))
        .where(whereExpr)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: count() })
        .from(commissions)
        .innerJoin(users, eq(commissions.userId, users.id))
        .where(whereExpr);

      return {
        items: rows,
        total: Number(countRow?.count ?? 0),
        page,
        limit,
      };
    }),

  // Get full commission detail (admin view, any commission)
  getCommission: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [commission] = await db
        .select()
        .from(commissions)
        .where(eq(commissions.id, input.id))
        .limit(1);
      if (!commission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Commission not found" });
      }
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, commission.userId))
        .limit(1);
      const events = await db
        .select({
          id: commissionEvents.id,
          type: commissionEvents.type,
          content: commissionEvents.content,
          createdAt: commissionEvents.createdAt,
          createdBy: commissionEvents.createdBy,
          createdByName: users.name,
          createdByEmail: users.email,
        })
        .from(commissionEvents)
        .leftJoin(users, eq(commissionEvents.createdBy, users.id))
        .where(eq(commissionEvents.commissionId, input.id))
        .orderBy(desc(commissionEvents.createdAt));
      const thread = await db
        .select({
          id: messages.id,
          content: messages.content,
          isStaffReply: messages.isStaffReply,
          createdAt: messages.createdAt,
          userId: messages.userId,
          userName: users.name,
        })
        .from(messages)
        .leftJoin(users, eq(messages.userId, users.id))
        .where(eq(messages.commissionId, input.id))
        .orderBy(messages.createdAt);
      return { ...commission, user, events, thread };
    }),

  // Update status
  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: commissionStatusEnum,
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(commissions)
        .where(eq(commissions.id, input.id))
        .limit(1);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Commission not found" });
      }
      await db
        .update(commissions)
        .set({ status: input.status })
        .where(eq(commissions.id, input.id));

      await db.insert(commissionEvents).values({
        commissionId: input.id,
        type: "statusChange",
        content: input.note?.trim() || `Status updated to ${input.status}`,
        createdBy: ctx.user.id,
      });

      const [updated] = await db
        .select()
        .from(commissions)
        .where(eq(commissions.id, input.id));
      return updated;
    }),

  // Update commission fields (admin)
  updateCommission: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        projectType: z
          .enum([
            "editorial",
            "brand",
            "publishing",
            "packaging",
            "motion",
            "other",
          ])
          .optional(),
        description: z.string().max(8000).optional(),
        deliverables: z.array(z.string()).optional(),
        budget: z
          .enum([
            "under5k",
            "5to10k",
            "10to25k",
            "25to50k",
            "over50k",
            "undisclosed",
          ])
          .optional(),
        rightsUsage: z
          .enum([
            "oneTime",
            "limited",
            "exclusive",
            "fullBuyout",
            "toBeDiscussed",
          ])
          .optional(),
        deadline: z.string().nullable().optional(),
        notes: z.string().max(8000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      const data: Record<string, unknown> = {};
      if (updates.title !== undefined) data.title = updates.title;
      if (updates.projectType !== undefined)
        data.projectType = updates.projectType;
      if (updates.description !== undefined)
        data.description = updates.description;
      if (updates.deliverables !== undefined)
        data.deliverables = updates.deliverables;
      if (updates.budget !== undefined) data.budget = updates.budget;
      if (updates.rightsUsage !== undefined)
        data.rightsUsage = updates.rightsUsage;
      if (updates.deadline !== undefined) {
        data.deadline = updates.deadline ? new Date(updates.deadline) : null;
      }
      if (updates.notes !== undefined) data.notes = updates.notes;
      await db.update(commissions).set(data).where(eq(commissions.id, id));
      const [updated] = await db
        .select()
        .from(commissions)
        .where(eq(commissions.id, id));
      return updated;
    }),

  // Add a note event to a commission timeline
  addEvent: adminQuery
    .input(
      z.object({
        commissionId: z.number(),
        type: z.enum(["note", "message", "file", "milestone"]).default("note"),
        content: z.string().min(1).max(4000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(commissionEvents).values({
        commissionId: input.commissionId,
        type: input.type,
        content: input.content,
        createdBy: ctx.user.id,
      });
      const [event] = await db
        .select()
        .from(commissionEvents)
        .where(eq(commissionEvents.commissionId, input.commissionId))
        .orderBy(desc(commissionEvents.createdAt))
        .limit(1);
      return event;
    }),

  // Post a staff reply on a commission thread
  replyToCommission: adminQuery
    .input(
      z.object({
        commissionId: z.number(),
        content: z.string().min(1).max(4000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [result] = await db.insert(messages).values({
        commissionId: input.commissionId,
        userId: ctx.user.id,
        content: input.content,
        isStaffReply: true,
      });
      await db.insert(commissionEvents).values({
        commissionId: input.commissionId,
        type: "message",
        content: input.content,
        createdBy: ctx.user.id,
      });
      const [created] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, Number(result.insertId)));
      return created;
    }),

  // Delete commission (admin override)
  deleteCommission: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(commissionEvents)
        .where(eq(commissionEvents.commissionId, input.id));
      await db
        .delete(messages)
        .where(eq(messages.commissionId, input.id));
      await db.delete(commissions).where(eq(commissions.id, input.id));
      return { success: true };
    }),

  // Public sanity ping (kept for uptime checks)
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
});

// Some imports kept for downstream type-safety
void lte;
void gte;
