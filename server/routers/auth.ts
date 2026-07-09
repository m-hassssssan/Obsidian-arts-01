import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery, adminQuery } from "../middleware";
import {
  createLocalUser,
  findUserByEmail,
  findUserByLogin,
  findUserById,
  touchLastSignIn,
  getUserStats,
} from "../queries/users";
import { getDb } from "../queries/connection";
import { users, messages, commissionEvents, commissions } from "@db/schema";
import { eq, desc, like, or, sql, and } from "drizzle-orm";
import { verifyPassword } from "../lib/password";
import {
  signSessionToken,
  sessionCookieName,
} from "../lib/jwt";
import { getSessionCookieOptions } from "../lib/cookies";
import { env } from "../lib/env";

function setSessionCookie(headers: Headers, token: string) {
  const opts = getSessionCookieOptions(headers, env.sessionTtlSeconds);
  const parts = [
    `${sessionCookieName}=${token}`,
    `Path=${opts.path}`,
    `Max-Age=${opts.maxAge ?? 0}`,
    `HttpOnly`,
    `SameSite=${opts.sameSite}`,
  ];
  if (opts.secure) parts.push("Secure");
  headers.append("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(headers: Headers) {
  headers.append(
    "Set-Cookie",
    `${sessionCookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  );
}

const signupSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
});

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export const authRouter = createRouter({
  signup: publicQuery
    .input(signupSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }
      const created = await createLocalUser({
        name: input.name,
        email: input.email,
        password: input.password,
      });
      const token = await signSessionToken({
        uid: created.id,
        unionId: created.unionId,
        role: created.role,
      });
      setSessionCookie(ctx.resHeaders, token);
      return {
        user: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
        },
      };
    }),

  login: publicQuery
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await findUserByLogin(input.login);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }
      if (user.status !== "active") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account is not active",
        });
      }
      const ok = await verifyPassword(input.password, user.passwordHash);
      if (!ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }
      await touchLastSignIn(user.id);
      const token = await signSessionToken({
        uid: user.id,
        unionId: user.unionId,
        role: user.role,
      });
      setSessionCookie(ctx.resHeaders, token);
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    clearSessionCookie(ctx.resHeaders);
    return { success: true };
  }),

  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
      avatar: ctx.user.avatar,
      status: ctx.user.status,
      createdAt: ctx.user.createdAt,
      lastSignInAt: ctx.user.lastSignInAt,
    };
  }),

  adminListUsers: adminQuery
    .input(
      z
        .object({
          search: z.string().optional(),
          role: z.enum(["user", "admin"]).optional(),
          status: z.enum(["active", "suspended", "banned"]).optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 50;
      const offset = (page - 1) * limit;
      const conditions = [];
      if (input?.search) {
        const q = `%${input.search}%`;
        conditions.push(or(like(users.name, q), like(users.email, q)));
      }
      if (input?.role) conditions.push(eq(users.role, input.role));
      if (input?.status) conditions.push(eq(users.status, input.status));
      const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;
      const list = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          avatar: users.avatar,
          createdAt: users.createdAt,
          lastSignInAt: users.lastSignInAt,
        })
        .from(users)
        .where(whereExpr)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);
      const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereExpr);
      return { items: list, total: Number(countRow?.count ?? 0), page, limit };
    }),

  adminGetUser: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await findUserById(input.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      const { passwordHash: _passwordHash, ...safe } = user;
      return safe;
    }),

  adminUpdateUser: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().max(320).optional(),
        role: z.enum(["user", "admin"]).optional(),
        status: z.enum(["active", "suspended", "banned"]).optional(),
        bio: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...updates } = input;
      
      const targetUser = await findUserById(id);
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (id === ctx.user.id && updates.role && updates.role !== "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot demote yourself",
        });
      }

      if (targetUser.email === "admin@obsidianarts.com") {
        if (updates.role && updates.role !== "admin") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot demote the permanent admin",
          });
        }
        if (updates.status && updates.status !== "active") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot suspend or ban the permanent admin",
          });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      await db.update(users).set(updateData).where(eq(users.id, id));
      
      const updated = await findUserById(id);
      const { passwordHash: _passwordHash, ...safe } = updated!;
      return safe;
    }),

  adminDeleteUser: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete yourself",
        });
      }
      
      const targetUser = await findUserById(input.id);
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (targetUser.email === "admin@obsidianarts.com") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete the permanent admin",
        });
      }

      const db = getDb();

      // Delete associated records first to satisfy foreign key constraints
      await db.delete(messages).where(or(eq(messages.userId, input.id), eq(messages.recipientId, input.id)));
      await db.delete(commissionEvents).where(eq(commissionEvents.createdBy, input.id));
      await db.delete(commissions).where(eq(commissions.userId, input.id));

      // Finally delete the user
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),

  adminStats: adminQuery.query(async () => {
    return getUserStats();
  }),

  updateProfile: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        bio: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.bio !== undefined) updateData.bio = input.bio;
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, ctx.user.id));
      const updated = await findUserById(ctx.user.id);
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const { passwordHash: _passwordHash, ...safe } = updated;
      return safe;
    }),
});
