import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-[#1a1a1a] text-white border-[#1a1a1a]",
  user: "bg-white text-[#1a1a1a] border-black",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-200 text-green-900 border-green-900",
  suspended: "bg-orange-200 text-orange-900 border-orange-900",
  banned: "bg-[#FF0004] text-white border-[#FF0004]",
};

export default function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [role, setRole] = useState<"all" | "user" | "admin">("all");
  const [status, setStatus] = useState<"all" | "active" | "suspended" | "banned">("all");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (params.get("search")) {
      setSearch(params.get("search") ?? "");
    }
  }, [params]);

  const query = trpc.auth.adminListUsers.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    role: role === "all" ? undefined : (role as "user" | "admin"),
    status: status === "all" ? undefined : (status as "active" | "suspended" | "banned"),
  });

  const updateMutation = trpc.auth.adminUpdateUser.useMutation({
    onSuccess: () => query.refetch(),
  });
  const deleteMutation = trpc.auth.adminDeleteUser.useMutation({
    onSuccess: () => query.refetch(),
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="font-inter text-sm text-[#1a1a1a]/60">
          {query.isLoading
            ? "Loading users…"
            : `${total} user${total === 1 ? "" : "s"} found`}
        </p>
        <div className="flex items-center border-[3px] border-black bg-white">
          <Search size={16} className="ml-3 text-[#1a1a1a]/50" />
          <input
            type="text"
            placeholder="Search name or email…"
            className="px-3 py-2 font-inter text-sm outline-none w-72"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setParams({});
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-y-[3px] border-black py-3">
        <span className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50">
          ROLE
        </span>
        {(["all", "user", "admin"] as const).map((r) => (
          <button
            key={r}
            onClick={() => {
              setRole(r);
              setPage(1);
            }}
            className={`px-3 py-1 font-oswald text-[10px] font-bold uppercase tracking-widest border-[2px] ${
              role === r
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-[#1a1a1a] border-black hover:bg-[#F9FF00]"
            }`}
          >
            {r}
          </button>
        ))}
        <span className="ml-4 font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50">
          STATUS
        </span>
        {(["all", "active", "suspended", "banned"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`px-3 py-1 font-oswald text-[10px] font-bold uppercase tracking-widest border-[2px] ${
              status === s
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-[#1a1a1a] border-black hover:bg-[#F9FF00]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="border-[3px] border-black bg-white overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-[#1a1a1a] text-white">
            <tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Last sign-in</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading && (
              <tr>
                <td colSpan={6} className="p-6 text-center font-inter text-sm">
                  Loading…
                </td>
              </tr>
            )}
            {!query.isLoading && query.data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="font-oswald text-sm uppercase tracking-widest text-[#1a1a1a]/40">
                    No users found
                  </div>
                </td>
              </tr>
            )}
            {query.data?.items.map((u) => (
              <tr key={u.id} className="border-b-[2px] border-black last:border-b-0">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 border-[2px] border-black bg-[#F9FF00] flex items-center justify-center font-oswald text-xs font-bold">
                      {(u.name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-oswald text-sm font-bold uppercase">
                        {u.name || "—"}
                      </div>
                      <div className="font-inter text-[11px] text-[#1a1a1a]/60 break-all">
                        {u.email}
                      </div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span
                    className={`inline-block border-[2px] px-2 py-0.5 font-oswald text-[10px] font-bold uppercase ${
                      ROLE_BADGE[u.role] ?? ""
                    }`}
                  >
                    {u.role}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`inline-block border-[2px] px-2 py-0.5 font-oswald text-[10px] font-bold uppercase ${
                      STATUS_BADGE[u.status] ?? ""
                    }`}
                  >
                    {u.status}
                  </span>
                </Td>
                <Td>
                  <span className="font-inter text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </Td>
                <Td>
                  <span className="font-inter text-xs">
                    {new Date(u.lastSignInAt).toLocaleString()}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(u.id)}
                      className="font-oswald text-[10px] font-bold uppercase tracking-widest hover:text-[#FF0004]"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delete user "${u.email}"? This cannot be undone.`,
                          )
                        ) {
                          deleteMutation.mutate({ id: u.id });
                        }
                      }}
                      className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#FF0004] hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={10} /> DELETE
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50">
          PAGE {page} / {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="btn-brutal btn-brutal-black flex items-center gap-1 text-xs disabled:opacity-30"
          >
            <ChevronLeft size={14} /> PREV
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="btn-brutal btn-brutal-black flex items-center gap-1 text-xs disabled:opacity-30"
          >
            NEXT <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {editingId !== null && (
        <EditUserModal
          userId={editingId}
          onClose={() => setEditingId(null)}
        />
      )}

      {(updateMutation.error || deleteMutation.error) && (
        <div className="fixed bottom-6 right-6 z-50 border-[3px] border-[#FF0004] bg-white p-4 max-w-sm">
          <p className="font-inter text-xs text-[#FF0004]">
            {updateMutation.error?.message ?? deleteMutation.error?.message}
          </p>
        </div>
      )}
    </div>
  );
}

function EditUserModal({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const user = trpc.auth.adminGetUser.useQuery({ id: userId });
  const update = trpc.auth.adminUpdateUser.useMutation({
    onSuccess: () => {
      utils.auth.adminListUsers.invalidate();
      utils.auth.adminGetUser.invalidate({ id: userId });
      onClose();
    },
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [status, setStatus] = useState<"active" | "suspended" | "banned">("active");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user.data && !name) {
      setName(user.data.name ?? "");
      setEmail(user.data.email ?? "");
      setRole(user.data.role as "user" | "admin");
      setStatus(user.data.status as "active" | "suspended" | "banned");
      setBio(user.data.bio ?? "");
    }
  }, [user.data, name]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border-[3px] border-black w-full max-w-lg">
        <div className="bg-[#1a1a1a] text-white px-5 py-3 flex items-center justify-between">
          <h2 className="font-oswald text-sm font-bold uppercase tracking-widest">
            Edit User #{userId}
          </h2>
          <button onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {user.isLoading ? (
          <div className="p-6 font-inter text-sm">Loading…</div>
        ) : user.error ? (
          <div className="p-6">
            <p className="font-inter text-sm text-[#FF0004]">
              {user.error.message}
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate({
                id: userId,
                name,
                email,
                role,
                status,
                bio: bio || undefined,
              });
            }}
            className="p-5 space-y-3"
          >
            <div>
              <label className="font-oswald text-[10px] font-bold uppercase tracking-widest block mb-1">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-brutal w-full text-sm"
              />
            </div>
            <div>
              <label className="font-oswald text-[10px] font-bold uppercase tracking-widest block mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-brutal w-full text-sm"
              />
            </div>
            <div>
              <label className="font-oswald text-[10px] font-bold uppercase tracking-widest block mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-brutal w-full text-sm min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-oswald text-[10px] font-bold uppercase tracking-widest block mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "user" | "admin")}
                  className="input-brutal w-full text-sm"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div>
                <label className="font-oswald text-[10px] font-bold uppercase tracking-widest block mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "active" | "suspended" | "banned")
                  }
                  className="input-brutal w-full text-sm"
                >
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                  <option value="banned">banned</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t-[2px] border-black">
              <button
                type="button"
                onClick={onClose}
                className="btn-brutal btn-brutal-black text-xs"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={update.isPending}
                className="btn-brutal btn-brutal-yellow text-xs flex items-center gap-1"
              >
                {update.isPending ? "SAVING…" : "SAVE CHANGES"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="text-left px-4 py-3 font-oswald text-[10px] font-bold uppercase tracking-widest">
      {children}
    </th>
  );
}

function Td({ children }: { children?: ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
}
