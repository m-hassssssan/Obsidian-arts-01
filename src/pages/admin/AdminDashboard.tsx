import { Link } from "react-router";
import type { ReactNode } from "react";
import { trpc } from "@/providers/trpc";
import {
  Inbox,
  Users as UsersIcon,
  MessageSquare,
  TrendingUp,
  Calendar,
  ArrowRight,
} from "lucide-react";

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

const PROJECT_TYPE_LABELS: Record<string, string> = {
  editorial: "Editorial",
  brand: "Brand",
  publishing: "Publishing",
  packaging: "Packaging",
  motion: "Motion",
  other: "Other",
};

export default function AdminDashboard() {
  const stats = trpc.admin.getStats.useQuery();
  const commissions = trpc.admin.listCommissions.useQuery({ limit: 6 });
  const userStats = trpc.auth.adminStats.useQuery();

  if (stats.isLoading || userStats.isLoading) {
    return (
      <div className="p-10">
        <div className="font-oswald text-sm uppercase tracking-widest text-[#1a1a1a]/50">
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (stats.error || userStats.error) {
    return (
      <div className="p-10">
        <div className="border-[3px] border-[#FF0004] bg-[#FF0004]/5 p-6">
          <h2 className="font-oswald text-lg font-bold uppercase text-[#FF0004]">
            Failed to load dashboard
          </h2>
          <p className="font-inter text-sm mt-2">
            {stats.error?.message ?? userStats.error?.message}
          </p>
        </div>
      </div>
    );
  }

  const s = stats.data!;
  const u = userStats.data!;
  const maxStatus = Math.max(1, ...Object.values(s.statusCounts));
  const maxBudget = Math.max(1, ...Object.values(s.budgetCounts));
  const maxType = Math.max(1, ...Object.values(s.typeCounts));

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Hero metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-0 border-[3px] border-black bg-white">
        <MetricTile
          label="Commissions"
          value={s.totalCommissions}
          icon={<Inbox size={20} />}
          tone="yellow"
        />
        <MetricTile
          label="Patrons"
          value={u.total}
          icon={<UsersIcon size={20} />}
          tone="white"
          borderLeft
        />
        <MetricTile
          label="Messages"
          value={s.totalMessages}
          icon={<MessageSquare size={20} />}
          tone="black"
          borderLeft
        />
      </section>

      {/* Secondary stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-[3px] border-black bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-oswald text-lg font-bold uppercase tracking-tight">
              Commission Status
            </h2>
            <Link
              to="/admin/commissions"
              className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 hover:text-[#1a1a1a] flex items-center gap-1"
            >
              VIEW ALL <ArrowRight size={10} />
            </Link>
          </div>
          <div className="space-y-2">
            {Object.entries(s.statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <BarRow
                  key={status}
                  label={humanize(status)}
                  value={count}
                  max={maxStatus}
                />
              ))}
            {Object.keys(s.statusCounts).length === 0 && (
              <Empty message="No commissions yet." />
            )}
          </div>
        </div>

        <div className="border-[3px] border-black bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-oswald text-lg font-bold uppercase tracking-tight">
              Project Types
            </h2>
          </div>
          <div className="space-y-2">
            {Object.entries(s.typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <BarRow
                  key={type}
                  label={PROJECT_TYPE_LABELS[type] ?? humanize(type)}
                  value={count}
                  max={maxType}
                />
              ))}
            {Object.keys(s.typeCounts).length === 0 && (
              <Empty message="No commissions yet." />
            )}
          </div>
        </div>
      </section>

      {/* Budget breakdown + recent activity */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-[3px] border-black bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-oswald text-lg font-bold uppercase tracking-tight">
              Budget Range
            </h2>
            <TrendingUp size={16} className="text-[#FF0004]" />
          </div>
          <div className="space-y-2">
            {[
              "under5k",
              "5to10k",
              "10to25k",
              "25to50k",
              "over50k",
              "undisclosed",
            ].map((b) => (
              <BarRow
                key={b}
                label={humanizeBudget(b)}
                value={s.budgetCounts[b] ?? 0}
                max={maxBudget}
              />
            ))}
          </div>
        </div>

        <div className="border-[3px] border-black bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-oswald text-lg font-bold uppercase tracking-tight">
              7-day Activity
            </h2>
            <Calendar size={16} className="text-[#1a1a1a]/60" />
          </div>
          {s.recentActivity.length === 0 ? (
            <Empty message="No activity in the last 7 days." />
          ) : (
            <div className="space-y-2">
              {s.recentActivity.map((r) => (
                <div
                  key={r.day}
                  className="flex items-center justify-between border-[2px] border-black px-3 py-2"
                >
                  <span className="font-inter text-sm font-mono">{r.day}</span>
                  <span className="font-oswald text-sm font-bold">
                    {r.count} new
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent commissions */}
      <section className="border-[3px] border-black bg-white">
        <div className="border-b-[3px] border-black px-6 py-4 flex items-center justify-between">
          <h2 className="font-oswald text-lg font-bold uppercase tracking-tight">
            Recent Commissions
          </h2>
          <Link
            to="/admin/commissions"
            className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 hover:text-[#1a1a1a] flex items-center gap-1"
          >
            VIEW ALL <ArrowRight size={10} />
          </Link>
        </div>
        {commissions.isLoading ? (
          <div className="p-6 font-inter text-sm text-[#1a1a1a]/50">Loading…</div>
        ) : commissions.data?.items.length === 0 ? (
          <div className="p-6">
            <Empty message="No commissions yet." />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#1a1a1a] text-white">
              <tr>
                <Th>Title</Th>
                <Th>Patron</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {commissions.data?.items.map((c) => (
                <tr key={c.id} className="border-b-[2px] border-black last:border-b-0">
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
                      {PROJECT_TYPE_LABELS[c.projectType] ?? c.projectType}
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
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </Td>
                  <Td>
                    <Link
                      to={`/admin/commissions/${c.id}`}
                      className="font-oswald text-[10px] font-bold uppercase tracking-widest hover:text-[#FF0004] flex items-center gap-1"
                    >
                      OPEN <ArrowRight size={10} />
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon,
  tone,
  borderLeft,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "yellow" | "white" | "black";
  borderLeft?: boolean;
}) {
  const bg =
    tone === "yellow"
      ? "bg-[#F9FF00]"
      : tone === "black"
        ? "bg-[#1a1a1a] text-white"
        : "bg-white";
  return (
    <div
      className={`${bg} ${borderLeft ? "md:border-l-[3px] md:border-black" : ""} p-6 md:p-8 border-b-[3px] md:border-b-0 border-black last:border-b-0`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`font-oswald text-[10px] font-bold uppercase tracking-widest ${
            tone === "black" ? "text-[#F9FF00]" : "text-[#1a1a1a]/60"
          }`}
        >
          {label}
        </span>
        {icon}
      </div>
      <div className="font-oswald text-5xl md:text-6xl font-bold leading-none">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(2, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-oswald text-xs font-bold uppercase tracking-wider">
          {label}
        </span>
        <span className="font-oswald text-xs font-bold">{value}</span>
      </div>
      <div className="h-3 bg-[#fafafa] border-[2px] border-black">
        <div
          className="h-full bg-[#F9FF00]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <span className="font-inter text-sm text-[#1a1a1a]/40">{message}</span>
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
    under5k: "Under $5K",
    "5to10k": "$5K — $10K",
    "10to25k": "$10K — $25K",
    "25to50k": "$25K — $50K",
    over50k: "Over $50K",
    undisclosed: "Undisclosed",
  };
  return map[s] ?? humanize(s);
}
