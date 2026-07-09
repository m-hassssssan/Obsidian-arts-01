import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

const globalForDb = globalThis as unknown as {
  dbInstance: ReturnType<typeof drizzle<typeof fullSchema>> | undefined;
};

export function getDb() {
  if (!globalForDb.dbInstance) {
    const poolConnection = mysql.createPool({
      uri: env.databaseUrl,
      connectionLimit: 5,
      maxIdle: 0, // Prevent idle connections from becoming zombies during Vercel isolate freezes
      idleTimeout: 1000, 
    });
    globalForDb.dbInstance = drizzle(poolConnection, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return globalForDb.dbInstance;
}
