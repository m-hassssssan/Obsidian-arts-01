import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { messages, users } from "@db/schema";
import { eq, desc, and, or, isNull } from "drizzle-orm";

export const messageRouter = createRouter({
  // All threads (admin) – list conversations grouped by commission
  list: authedQuery
    .input(
      z
        .object({
          commissionId: z.number().optional(),
          onlyUnassigned: z.boolean().optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 50;
      const offset = (page - 1) * limit;

      if (input?.commissionId) {
        const rows = await db
          .select({
            id: messages.id,
            content: messages.content,
            isStaffReply: messages.isStaffReply,
            createdAt: messages.createdAt,
            userId: messages.userId,
            userName: users.name,
            userEmail: users.email,
            userRole: users.role,
            commissionId: messages.commissionId,
          })
          .from(messages)
          .leftJoin(users, eq(messages.userId, users.id))
          .where(eq(messages.commissionId, input.commissionId))
          .orderBy(messages.createdAt)
          .limit(limit)
          .offset(offset);
        return { items: rows, total: rows.length, page, limit };
      }

      // Default: messages user participated in (or, if admin, all)
      if (ctx.user.role === "admin") {
        const rows = await db
          .select({
            id: messages.id,
            content: messages.content,
            isStaffReply: messages.isStaffReply,
            createdAt: messages.createdAt,
            userId: messages.userId,
            userName: users.name,
            userEmail: users.email,
            userRole: users.role,
            commissionId: messages.commissionId,
          })
          .from(messages)
          .leftJoin(users, eq(messages.userId, users.id))
          .orderBy(desc(messages.createdAt))
          .limit(limit)
          .offset(offset);
        return { items: rows, total: rows.length, page, limit };
      }

      const rows = await db
        .select({
          id: messages.id,
          content: messages.content,
          isStaffReply: messages.isStaffReply,
          createdAt: messages.createdAt,
          userId: messages.userId,
          userName: users.name,
          userEmail: users.email,
          userRole: users.role,
          commissionId: messages.commissionId,
        })
        .from(messages)
        .leftJoin(users, eq(messages.userId, users.id))
        .where(
          or(
            eq(messages.userId, ctx.user.id),
            and(eq(messages.isStaffReply, true), isNull(messages.commissionId))
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset);
      return { items: rows, total: rows.length, page, limit };
    }),

  create: authedQuery
    .input(
      z.object({
        commissionId: z.number().nullable().optional(),
        content: z.string().min(1).max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db.insert(messages).values({
        userId: ctx.user.id,
        commissionId: input.commissionId || null,
        content: input.content,
        isStaffReply: ctx.user.role === "admin",
      });
      const [created] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, Number(result.insertId)));
      return created;
    }),

  // Admin: delete a message
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(messages).where(eq(messages.id, input.id));
      return { success: true };
    }),
});

// silence unused import warning
void and;
