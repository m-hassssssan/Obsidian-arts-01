import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { trpc } from "@/providers/trpc";

export type AuthUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  avatar?: string | null;
  status?: "active" | "suspended" | "banned";
  createdAt?: Date | string | null;
  lastSignInAt?: Date | string | null;
};

type AuthState =
  | { status: "loading"; user: null }
  | { status: "authenticated"; user: AuthUser }
  | { status: "anonymous"; user: null };

type AuthContextValue = {
  state: AuthState;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const utils = trpc.useUtils();

  const refresh = async () => {
    await utils.auth.me.invalidate();
    await meQuery.refetch();
  };

  useEffect(() => {
    if (meQuery.isLoading) {
      setState({ status: "loading", user: null });
      return;
    }
    if (meQuery.data) {
      setState({ status: "authenticated", user: meQuery.data as AuthUser });
    } else {
      setState({ status: "anonymous", user: null });
    }
  }, [meQuery.data, meQuery.isLoading]);

  const signOut = async () => {
    try {
      await utils.client.auth.logout.mutate();
    } catch {
      // ignore
    }
    setState({ status: "anonymous", user: null });
    await refresh();
  };

  return (
    <AuthContext.Provider value={{ state, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
