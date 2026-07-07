import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",

  // Auth
  sessionSecret: optional("APP_SECRET", "dev-only-secret-change-me-in-prod"),
  sessionTtlSeconds: parseInt(
    optional("SESSION_TTL_SECONDS", String(60 * 60 * 24 * 14)),
    10,
  ),

  // CORS / frontend origin
  frontendOrigin: optional("FRONTEND_ORIGIN", "http://localhost:3000"),

  // GitHub integration (optional — reads work tokenless, writes need a PAT)
  githubToken: process.env.GITHUB_TOKEN ?? "",
  githubOwner: process.env.GITHUB_OWNER ?? "m-hassssssan",
  githubRepo: process.env.GITHUB_REPO ?? "OBSIDIAN.ARTS",
  githubConfigured: Boolean(process.env.GITHUB_TOKEN),
};
