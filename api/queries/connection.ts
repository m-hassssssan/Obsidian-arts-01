import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

const globalForDb = globalThis as unknown as {
  dbInstance: ReturnType<typeof drizzle<typeof fullSchema>> | undefined;
};

export function getDb() {
  if (!globalForDb.dbInstance) {
    globalForDb.dbInstance = drizzle(env.databaseUrl, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return globalForDb.dbInstance;
}
