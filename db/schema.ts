import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  json,
  date,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const commissions = mysqlTable("commissions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  projectType: mysqlEnum("projectType", [
    "editorial",
    "brand",
    "publishing",
    "packaging",
    "motion",
    "other",
  ]).notNull(),
  description: text("description"),
  deliverables: json("deliverables").$type<string[]>(),
  deadline: date("deadline"),
  budget: mysqlEnum("budget", [
    "under5k",
    "5to10k",
    "10to25k",
    "25to50k",
    "over50k",
    "undisclosed",
  ]).default("undisclosed"),
  rightsUsage: mysqlEnum("rightsUsage", [
    "oneTime",
    "limited",
    "exclusive",
    "fullBuyout",
    "toBeDiscussed",
  ]).default("toBeDiscussed"),
  visualReferences: json("visualReferences").$type<string[]>(),
  status: mysqlEnum("status", [
    "draft",
    "submitted",
    "inReview",
    "approved",
    "inProgress",
    "revision",
    "completed",
    "cancelled",
  ]).default("draft"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

export const commissionEvents = mysqlTable("commissionEvents", {
  id: serial("id").primaryKey(),
  commissionId: bigint("commissionId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => commissions.id),
  type: mysqlEnum("type", [
    "statusChange",
    "note",
    "message",
    "file",
    "milestone",
  ]).notNull(),
  content: text("content").notNull(),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }).references(
    () => users.id
  ),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommissionEvent = typeof commissionEvents.$inferSelect;

export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  commissionId: bigint("commissionId", {
    mode: "number",
    unsigned: true,
  }).references(() => commissions.id),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  isStaffReply: boolean("isStaffReply").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
