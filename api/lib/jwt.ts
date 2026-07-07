import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const SESSION_COOKIE = "obsidian_sid";

function getSecret(): Uint8Array {
  const secret = env.sessionSecret;
  if (!secret) {
    throw new Error("APP_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  uid: number;
  unionId: string;
  role: "user" | "admin";
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(env.appId || "obsidian-arts")
    .setExpirationTime(`${env.sessionTtlSeconds}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: env.appId || "obsidian-arts",
    });
    if (
      typeof payload.uid === "number" &&
      typeof payload.unionId === "string" &&
      (payload.role === "user" || payload.role === "admin")
    ) {
      return {
        uid: payload.uid,
        unionId: payload.unionId,
        role: payload.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const sessionCookieName = SESSION_COOKIE;
