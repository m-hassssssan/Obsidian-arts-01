import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { eq } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { users, type User } from "@db/schema";
import { sessionCookieName, verifySessionToken } from "./lib/jwt";
import { parse as parseCookie } from "cookie";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  const parsed = parseCookie(header);
  return parsed[name];
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const resHeaders = new Headers();
  const token = readCookie(opts.req, sessionCookieName);
  let user: User | undefined;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      const db = getDb();
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.uid))
        .limit(1);
      if (found && found.status === "active") {
        user = found;
      }
    }
  }
  return { req: opts.req, resHeaders, user };
}
