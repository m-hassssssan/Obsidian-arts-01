import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import type { ReactNode } from "react";

const STATUSES = [
  "all",
  "draft",
  "submitted",
  "inReview",
  "approved",
  "inProgress",
  "revision",
  "completed",
  "cancelled",
] as const;

const TYPES = [
  { value: "all", label: "All Types" },
  { value: "editorial", label: "Editorial" },
  { value: "brand", label: "Brand" },
  { value: "publishing", label: "Publishing" },
  { value: "packaging", label: "Packaging" },
  { value: "motion", label: "Motion" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-white text-[#1a1a1a] border-black",
  submitted: "bg-[#F9FF00] text-black border-black",
  inReview: "bg-blue-200 text-blue-900 border-blue-900",
  approved: "bg-green-200 text-green-900 border-green-900",
  inProgress: "bg-purple-200 text-purple-900 border-purple-900",
  revision: "bg-orange-200 text-orange-900 border-orange-900",
  completed: "bg-[#1a1a1a] text-white border-[#1a1a1a]",
  cancelled: "bg-red-200 text-red-900 border-red-900",
};

export default function AdminCommissions() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [projectType, setProjectType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "title" | "status">(
    "createdAt",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const input = {
    page,
    limit: 20,
    status: status === "all" ? undefined : status,
    projectType: projectType === "all" ? undefined : projectType,
    search: search || undefined,
    sortBy,
    sortDir,
  };

  const query = trpc.admin.listCommissions.useQuery(input);

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="font-inter text-sm text-[#1a1a1a]/60">
          {query.isLoading
            ? "Loading commissions…"
            : `${total} commission${total === 1 ? "" : "s"} found`}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center border-[3px] border-black bg-white">
            <Search size={16} className="ml-3 text-[#1a1a1a]/50" />
            <input
              type="text"
              placeholder="Search title, patron, email…"
              className="px-3 py-2 font-inter text-sm outline-none w-72"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-y-[3px] border-black py-3">
        <span className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50 flex items-center gap-1">
          <Filter size={10} /> STATUS
        </span>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`px-3 py-1 font-oswald text-[10px] font-bold uppercase tracking-widest border-[2px] transition-colors ${
              status === s
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-[#1a1a1a] border-black hover:bg-[#F9FF00]"
            }`}
          >
            {s === "all" ? "All" : humanize(s)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50 flex items-center gap-1">
          <Filter size={10} /> TYPE
        </span>
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setProjectType(t.value);
              setPage(1);
            }}
            className={`px-3 py-1 font-oswald text-[10px] font-bold uppercase tracking-widest border-[2px] transition-colors ${
              projectType === t.value
                ? "bg-[#F9FF00] text-black border-black"
                : "bg-white text-[#1a1a1a] border-black hover:bg-[#F9FF00]/50"
            }`}
          >
            {t.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50 flex items-center gap-1">
            <ArrowUpDown size={10} /> SORT
          </span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as typeof sortBy)
            }
            className="border-[2px] border-black bg-white px-2 py-1 font-oswald text-[10px] font-bold uppercase"
          >
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className="border-[2px] border-black bg-white px-2 py-1 font-oswald text-[10px] font-bold uppercase"
          >
            {sortDir === "asc" ? "↑ ASC" : "↓ DESC"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border-[3px] border-black bg-white overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-[#1a1a1a] text-white">
            <tr>
              <Th>ID</Th>
              <Th>Title</Th>
              <Th>Patron</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Budget</Th>
              <Th>Updated</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading && (
              <tr>
                <td colSpan={8} className="p-6 text-center font-inter text-sm">
                  Loading…
                </td>
              </tr>
            )}
            {!query.isLoading && query.data?.items.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <div className="font-oswald text-sm uppercase tracking-widest text-[#1a1a1a]/40">
                    No commissions match your filters
                  </div>
                </td>
              </tr>
            )}
            {query.data?.items.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/admin/commissions/${c.id}`)}
                className="border-b-[2px] border-black last:border-b-0 hover:bg-[#F9FF00]/30 cursor-pointer"
              >
                <Td>
                  <span className="font-mono text-xs">#{c.id}</span>
                </Td>
                <Td>
                  <span className="font-oswald text-sm font-bold uppercase">
                    {c.title}
                  </span>
                </Td>
                <Td>
                  <div className="font-inter text-sm">{c.userName || "—"}</div>
                  <div className="font-inter text-[10px] text-[#1a1a1a]/50">
                    {c.userEmail}
                  </div>
                </Td>
                <Td>
                  <span className="font-inter text-xs">
                    {humanize(c.projectType)}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`inline-block border-[2px] px-2 py-0.5 font-oswald text-[10px] font-bold uppercase ${
                      STATUS_COLORS[c.status ?? ""] ?? ""
                    }`}
                  >
                    {humanize(c.status ?? "")}
                  </span>
                </Td>
                <Td>
                  <span className="font-inter text-xs">
                    {humanizeBudget(c.budget ?? "")}
                  </span>
                </Td>
                <Td>
                  <span className="font-inter text-xs">
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </Td>
                <Td>
                  <Link
                    to={`/admin/commissions/${c.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-oswald text-[10px] font-bold uppercase tracking-widest hover:text-[#FF0004]"
                  >
                    OPEN
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

function humanize(s: string): string {
  return s
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function humanizeBudget(s: string): string {
  const map: Record<string, string> = {
    under5k: "<$5K",
    "5to10k": "$5–10K",
    "10to25k": "$10–25K",
    "25to50k": "$25–50K",
    over50k: ">$50K",
    undisclosed: "—",
  };
  return map[s] ?? humanize(s);
}
