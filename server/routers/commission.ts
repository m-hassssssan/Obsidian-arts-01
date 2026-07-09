import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { commissions, commissionEvents, users } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const commissionRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          status: z.string().optional(),
          search: z.string().optional(),
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
      const conditions = [eq(commissions.userId, ctx.user.id)];
      if (input?.status) {
        // @ts-ignore – drizzle narrow type for enum values
        conditions.push(eq(commissions.status, input.status));
      }
      const rows = await db
        .select()
        .from(commissions)
        .where(and(...conditions))
        .orderBy(desc(commissions.updatedAt))
        .limit(limit)
        .offset(offset);
      return { items: rows, page, limit };
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
            eq(commissions.userId, ctx.user.id),
          ),
        );
      if (!commission) return null;
      const events = await db
        .select()
        .from(commissionEvents)
        .where(eq(commissionEvents.commissionId, input.id))
        .orderBy(desc(commissionEvents.createdAt));
      return { ...commission, events };
    }),

  // Public: anonymous patron can submit a "draft" inquiry
  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        projectType: z.enum([
          "editorial",
          "brand",
          "publishing",
          "packaging",
          "motion",
          "other",
        ]),
        description: z.string().max(8000).optional(),
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
          .enum([
            "oneTime",
            "limited",
            "exclusive",
            "fullBuyout",
            "toBeDiscussed",
          ])
          .optional(),
        visualReferences: z.array(z.string()).optional(),
        guestEmail: z.string().email().optional(),
        guestName: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      let userId = ctx.user?.id;
      if (!userId) {
        // Anonymous patron: create a guest user
        const guestEmail =
          input.guestEmail ||
          `patron-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@guest.obsidianarts.local`;
        const guestName = input.guestName || "Anonymous Patron";
        const [insertResult] = await db.insert(users).values({
          email: guestEmail,
          name: guestName,
          role: "user",
          unionId: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        });
        userId = Number(insertResult.insertId);
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
        status: "submitted",
      });

      // Initial event
      await db.insert(commissionEvents).values({
        commissionId: Number(result.insertId),
        type: "statusChange",
        content: "Commission submitted for review",
        createdBy: userId,
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
          .enum([
            "oneTime",
            "limited",
            "exclusive",
            "fullBuyout",
            "toBeDiscussed",
          ])
          .optional(),
        visualReferences: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.projectType !== undefined)
        updateData.projectType = updates.projectType;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.deliverables !== undefined)
        updateData.deliverables = updates.deliverables;
      if (updates.deadline !== undefined)
        updateData.deadline = updates.deadline
          ? new Date(updates.deadline)
          : null;
      if (updates.budget !== undefined) updateData.budget = updates.budget;
      if (updates.rightsUsage !== undefined)
        updateData.rightsUsage = updates.rightsUsage;
      if (updates.visualReferences !== undefined)
        updateData.visualReferences = updates.visualReferences;

      await db
        .update(commissions)
        .set(updateData)
        .where(and(eq(commissions.id, id), eq(commissions.userId, ctx.user.id)));

      const [updated] = await db
        .select()
        .from(commissions)
        .where(and(eq(commissions.id, id), eq(commissions.userId, ctx.user.id)));
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return updated;
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(commissions)
        .where(
          and(
            eq(commissions.id, input.id),
            eq(commissions.userId, ctx.user.id),
          ),
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
          and(
            eq(commissions.id, input.id),
            eq(commissions.userId, ctx.user.id),
          ),
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
          and(
            eq(commissions.id, input.id),
            eq(commissions.userId, ctx.user.id),
          ),
        );
      return updated;
    }),
});
