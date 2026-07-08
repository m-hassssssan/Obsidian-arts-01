import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";

export const trpc = createTRPCReact<AppRouter>();

// In dev (Vite) the tRPC endpoint is proxied at /api/trpc, so a relative
// URL is enough. In a static deploy (e.g. GitHub Pages) the backend runs
// elsewhere, so VITE_API_BASE_URL must be set to the full URL of the tRPC
// endpoint, e.g. "https://api.example.com/api/trpc".
function resolveBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl && envUrl.length > 0) return envUrl.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "/api/trpc";
  // Last-resort fallback for static deploys that forgot to set the env
  // var: keep the relative URL so the user sees a clear network error in
  // DevTools rather than a silently wrong host.
  return "/api/trpc";
}

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: resolveBaseUrl(),
      transformer: superjson,
      // credentials: "include" is required so the session cookie sent by
      // the backend is attached to every request, including cross-origin
      // ones to a separately-hosted API.
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
