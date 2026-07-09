import { eq, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";
import { hashPassword } from "../lib/password";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return rows.at(0);
}

export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}

export async function findUserByLogin(login: string) {
  // login is either email or unionId
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.users)
    .where(
      or(
        eq(schema.users.email, login),
        eq(schema.users.unionId, login),
      ),
    )
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data };
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await getDb()
    .insert(schema.users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function createLocalUser(input: {
  name: string;
  email: string;
  password: string;
  role?: "user" | "admin";
}) {
  const db = getDb();
  const passwordHash = await hashPassword(input.password);
  const unionId = `local-${nanoid(16)}`;
  const values: InsertUser = {
    name: input.name,
    email: input.email,
    passwordHash,
    unionId,
    role: input.role ?? "user",
  };
  if (input.role === "admin") {
    // already set above
  } else if (unionId === env.ownerUnionId) {
    values.role = "admin";
  }
  await db.insert(schema.users).values(values);
  const created = await findUserByEmail(input.email);
  return created;
}

export async function touchLastSignIn(id: number) {
  await getDb()
    .update(schema.users)
    .set({ lastSignInAt: new Date() })
    .where(eq(schema.users.id, id));
}

export async function getUserStats() {
  const db = getDb();
  const [counts] = await db
    .select({
      total: sql<number>`count(*)`,
      admins: sql<number>`sum(case when role='admin' then 1 else 0 end)`,
      active: sql<number>`sum(case when status='active' then 1 else 0 end)`,
      suspended: sql<number>`sum(case when status='suspended' then 1 else 0 end)`,
    })
    .from(schema.users);
  return {
    total: Number(counts?.total ?? 0),
    admins: Number(counts?.admins ?? 0),
    active: Number(counts?.active ?? 0),
    suspended: Number(counts?.suspended ?? 0),
  };
}
