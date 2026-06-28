import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { commissions, commissionEvents, users } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const commissionRouter = createRouter({
  list: authedQuery
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(commissions.userId, ctx.user.id)];
      if (input?.status) {
        // @ts-ignore
        conditions.push(eq(commissions.status, input.status));
      }
      const results = await db
        .select()
        .from(commissions)
        .where(and(...conditions))
        .orderBy(desc(commissions.updatedAt));
      return results;
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [commission] = await db
        .select()
        .from(commissions)
        .where(
          and(
            eq(commissions.id, input.id),
            eq(commissions.userId, ctx.user.id)
          )
        );
      if (!commission) return null;
      const events = await db
        .select()
        .from(commissionEvents)
        .where(eq(commissionEvents.commissionId, input.id))
        .orderBy(desc(commissionEvents.createdAt));
      return { ...commission, events };
    }),

  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1),
        projectType: z.enum([
          "editorial",
          "brand",
          "publishing",
          "packaging",
          "motion",
          "other",
        ]),
        description: z.string().optional(),
        deliverables: z.array(z.string()).optional(),
        deadline: z.string().optional(),
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
          .enum(["oneTime", "limited", "exclusive", "fullBuyout", "toBeDiscussed"])
          .optional(),
        visualReferences: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      let userId = ctx.user?.id;
      if (!userId) {
        // If not logged in, map to the first user or insert a system user
        const [firstUser] = await db.select().from(users).limit(1);
        if (firstUser) {
          userId = firstUser.id;
        } else {
          const [insertResult] = await db.insert(users).values({
            email: "patron@obsidianarts.com",
            name: "Anonymous Patron",
            role: "user",
            unionId: "system-patron-union-id",
          });
          userId = Number(insertResult.insertId);
        }
      }
      const [result] = await db.insert(commissions).values({
        userId,
        title: input.title,
        projectType: input.projectType,
        description: input.description || null,
        deliverables: input.deliverables || null,
        deadline: input.deadline ? new Date(input.deadline) : null,
        budget: input.budget || "undisclosed",
        rightsUsage: input.rightsUsage || "toBeDiscussed",
        visualReferences: input.visualReferences || null,
        status: "draft",
      });
      const [created] = await db
        .select()
        .from(commissions)
        .where(eq(commissions.id, Number(result.insertId)));
      return created;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
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
        description: z.string().optional(),
        deliverables: z.array(z.string()).optional(),
        deadline: z.string().optional(),
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
          .enum(["oneTime", "limited", "exclusive", "fullBuyout", "toBeDiscussed"])
          .optional(),
        visualReferences: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.projectType !== undefined) updateData.projectType = updates.projectType;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.deliverables !== undefined) updateData.deliverables = updates.deliverables;
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline ? new Date(updates.deadline) : null;
      if (updates.budget !== undefined) updateData.budget = updates.budget;
      if (updates.rightsUsage !== undefined) updateData.rightsUsage = updates.rightsUsage;
      if (updates.visualReferences !== undefined) updateData.visualReferences = updates.visualReferences;

      await db
        .update(commissions)
        .set(updateData)
        .where(and(eq(commissions.id, id), eq(commissions.userId, ctx.user.id)));

      const [updated] = await db
        .select()
        .from(commissions)
        .where(
          and(eq(commissions.id, id), eq(commissions.userId, ctx.user.id))
        );
      return updated;
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(commissions)
        .where(
          and(eq(commissions.id, input.id), eq(commissions.userId, ctx.user.id))
        );
      return { success: true };
    }),

  submit: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(commissions)
        .set({ status: "submitted" })
        .where(
          and(eq(commissions.id, input.id), eq(commissions.userId, ctx.user.id))
        );

      await db.insert(commissionEvents).values({
        commissionId: input.id,
        type: "statusChange",
        content: "Commission submitted for review",
        createdBy: ctx.user.id,
      });

      const [updated] = await db
        .select()
        .from(commissions)
        .where(
          and(eq(commissions.id, input.id), eq(commissions.userId, ctx.user.id))
        );
      return updated;
    }),
});
