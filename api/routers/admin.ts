import { z } from "zod";
import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { commissions, commissionEvents, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const adminRouter = createRouter({
  listCommissions: adminQuery
    .input(
      z
        .object({
          status: z.string().optional(),
          page: z.number().default(1),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const limit = 50;
      const offset = ((input?.page ?? 1) - 1) * limit;
      const results = await db
        .select({
          id: commissions.id,
          title: commissions.title,
          projectType: commissions.projectType,
          status: commissions.status,
          budget: commissions.budget,
          deadline: commissions.deadline,
          createdAt: commissions.createdAt,
          updatedAt: commissions.updatedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(commissions)
        .innerJoin(users, eq(commissions.userId, users.id))
        .orderBy(desc(commissions.createdAt))
        .limit(limit)
        .offset(offset);
      return results;
    }),

  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "draft",
          "submitted",
          "inReview",
          "approved",
          "inProgress",
          "revision",
          "completed",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(commissions)
        .set({ status: input.status })
        .where(eq(commissions.id, input.id));

      await db.insert(commissionEvents).values({
        commissionId: input.id,
        type: "statusChange",
        content: `Status updated to ${input.status}`,
        createdBy: ctx.user.id,
      });

      const [updated] = await db
        .select()
        .from(commissions)
        .where(eq(commissions.id, input.id));
      return updated;
    }),

  getStats: adminQuery.query(async () => {
    const db = getDb();
    const allCommissions = await db.select().from(commissions);
    const allUsers = await db.select().from(users);
    const statusCounts: Record<string, number> = {};
    for (const c of allCommissions) {
      const st = c.status ?? "unknown";
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    }
    return {
      totalCommissions: allCommissions.length,
      totalUsers: allUsers.length,
      statusCounts,
    };
  }),
});
