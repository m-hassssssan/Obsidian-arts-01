import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { messages } from "@db/schema";
import { eq, desc, isNull, or, and } from "drizzle-orm";

export const messageRouter = createRouter({
  list: authedQuery
    .input(z.object({ commissionId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.commissionId) {
        conditions.push(eq(messages.commissionId, input.commissionId));
      } else {
        conditions.push(or(eq(messages.userId, ctx.user.id), isNull(messages.commissionId)));
      }
      const results = await db
        .select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(100);
      return results.reverse();
    }),

  create: authedQuery
    .input(
      z.object({
        commissionId: z.number().nullable().optional(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db.insert(messages).values({
        userId: ctx.user.id,
        commissionId: input.commissionId || null,
        content: input.content,
        isStaffReply: false,
      });
      const [created] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, Number(result.insertId)));
      return created;
    }),
});
