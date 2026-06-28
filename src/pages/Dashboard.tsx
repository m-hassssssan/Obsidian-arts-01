import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Navigation } from "@/components/Navigation";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trash2,
  Send,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft Request", color: "bg-gray-100", icon: <FileText size={14} /> },
  submitted: { label: "Submitted", color: "bg-yellow-50", icon: <Send size={14} /> },
  inReview: { label: "Curator Review", color: "bg-blue-50", icon: <Clock size={14} /> },
  approved: { label: "Approved", color: "bg-green-50", icon: <CheckCircle2 size={14} /> },
  inProgress: { label: "Arrangement", color: "bg-purple-50", icon: <Circle size={14} /> },
  revision: { label: "Details Review", color: "bg-orange-50", icon: <AlertCircle size={14} /> },
  completed: { label: "Acquired", color: "bg-green-100", icon: <CheckCircle2 size={14} /> },
  cancelled: { label: "Withdrawn", color: "bg-red-50", icon: <AlertCircle size={14} /> },
};

const budgetLabels: Record<string, string> = {
  under5k: "Under $5,000",
  "5to10k": "$5,000 — $10,000",
  "10to25k": "$10,000 — $25,000",
  "25to50k": "$25,000 — $50,000",
  over50k: "Over $50,000",
  undisclosed: "Prefer not to say",
};

const projectTypeLabels: Record<string, string> = {
  editorial: "PAINTING & CANVAS",
  brand: "SCULPTURE & FORM",
  publishing: "DIGITAL & NEW MEDIA",
  packaging: "AVANT-GARDE PHOTOGRAPHY",
  motion: "KINETIC & MOTION ART",
  other: "OTHER / MIXED MEDIA",
};

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const utils = trpc.useUtils();

  const { data: commissions, isLoading: commissionsLoading } =
    trpc.commission.list.useQuery(
      filter === "all" ? undefined : { status: filter }
    );

  const deleteMutation = trpc.commission.delete.useMutation({
    onSuccess: () => utils.commission.list.invalidate(),
  });

  const submitMutation = trpc.commission.submit.useMutation({
    onSuccess: () => utils.commission.list.invalidate(),
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="font-oswald text-xl uppercase tracking-widest">
          Loading...
        </div>
      </div>
    );
  }

  const activeCount = commissions?.filter((c) => c.status !== "draft" && c.status !== "completed" && c.status !== "cancelled").length || 0;
  const draftCount = commissions?.filter((c) => c.status === "draft").length || 0;
  const completedCount = commissions?.filter((c) => c.status === "completed").length || 0;

  const filteredCommissions = filter === "all"
    ? commissions
    : commissions?.filter((c) => c.status === filter);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="pt-20 pb-16">
        {/* Header */}
        <div className="px-6 md:px-12 lg:px-16 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/"
              className="flex items-center gap-2 font-oswald text-sm uppercase tracking-wider hover:text-[#FF0004] transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Gallery
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#FF0004] block mb-2">
                Patron Portal
              </span>
              <h1 className="font-oswald text-4xl md:text-5xl font-bold uppercase tracking-[-0.03em]">
                PATRON DASHBOARD
              </h1>
            </div>
            <div className="font-inter text-sm text-[#1a1a1a]/60">
              Welcome back, {user?.name || "Patron"}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 md:px-12 lg:px-16 mb-8">
          <div className="grid grid-cols-3 border-[3px] border-black">
            <div className="border-r-[3px] border-black px-6 py-5">
              <div className="font-oswald text-3xl font-bold">{activeCount}</div>
              <div className="font-inter text-[10px] uppercase tracking-widest text-[#1a1a1a]/50 mt-1">
                Active Inquiries
              </div>
            </div>
            <div className="border-r-[3px] border-black px-6 py-5">
              <div className="font-oswald text-3xl font-bold">{draftCount}</div>
              <div className="font-inter text-[10px] uppercase tracking-widest text-[#1a1a1a]/50 mt-1">
                Draft Requests
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="font-oswald text-3xl font-bold">{completedCount}</div>
              <div className="font-inter text-[10px] uppercase tracking-widest text-[#1a1a1a]/50 mt-1">
                Acquisitions
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 md:px-12 lg:px-16 mb-6">
          <div className="flex flex-wrap gap-0 border-[3px] border-black">
            {[
              { value: "all", label: "ALL" },
              { value: "draft", label: "DRAFTS" },
              { value: "submitted", label: "SUBMITTED" },
              { value: "inReview", label: "CURATOR REVIEW" },
              { value: "approved", label: "APPROVED" },
              { value: "inProgress", label: "ARRANGEMENT" },
              { value: "completed", label: "ACQUIRED" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 font-oswald text-xs font-bold uppercase tracking-wider border-r-[3px] border-black last:border-r-0 transition-colors ${
                  filter === f.value
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-white hover:bg-[#F9FF00]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Commissions Table */}
        <div className="px-6 md:px-12 lg:px-16">
          {commissionsLoading ? (
            <div className="border-[3px] border-black p-12 text-center">
              <span className="font-oswald text-lg uppercase tracking-widest">
                Loading inquiries...
              </span>
            </div>
          ) : filteredCommissions && filteredCommissions.length > 0 ? (
            <div className="border-[3px] border-black">
              {/* Table Header */}
              <div className="grid grid-cols-12 border-b-[3px] border-black bg-[#1a1a1a] text-white">
                <div className="col-span-4 md:col-span-3 px-4 py-3 font-oswald text-xs font-bold uppercase tracking-widest">
                  Inquiry Reference
                </div>
                <div className="hidden md:block col-span-2 px-4 py-3 font-oswald text-xs font-bold uppercase tracking-widest border-l-[3px] border-white/20">
                  Art Medium
                </div>
                <div className="col-span-3 md:col-span-2 px-4 py-3 font-oswald text-xs font-bold uppercase tracking-widest border-l-[3px] border-white/20">
                  Curatorial Status
                </div>
                <div className="hidden md:block col-span-2 px-4 py-3 font-oswald text-xs font-bold uppercase tracking-widest border-l-[3px] border-white/20">
                  Valuation
                </div>
                <div className="col-span-3 md:col-span-2 px-4 py-3 font-oswald text-xs font-bold uppercase tracking-widest border-l-[3px] border-white/20">
                  Actions
                </div>
              </div>

              {/* Rows */}
              {filteredCommissions.map((commission) => {
                const status = statusConfig[commission.status || "draft"] || statusConfig.draft;
                return (
                  <div
                    key={commission.id}
                    className="grid grid-cols-12 border-b-[3px] border-black last:border-b-0 hover:bg-[#F9FF00]/20 transition-colors"
                  >
                    <div className="col-span-4 md:col-span-3 px-4 py-4">
                      <Link
                        to={`/commission/${commission.id}`}
                        className="font-oswald text-sm font-bold uppercase tracking-tight hover:text-[#FF0004] transition-colors"
                      >
                        {commission.title}
                      </Link>
                      <div className="font-inter text-[10px] text-[#1a1a1a]/50 mt-1">
                        {commission.createdAt
                          ? new Date(commission.createdAt).toLocaleDateString()
                          : ""}
                      </div>
                    </div>
                    <div className="hidden md:flex col-span-2 px-4 py-4 border-l-[3px] border-black items-center">
                      <span className="font-inter text-xs">
                        {projectTypeLabels[commission.projectType] || commission.projectType}
                      </span>
                    </div>
                    <div className="col-span-3 md:col-span-2 px-4 py-4 border-l-[3px] border-black flex items-center gap-2">
                      <span className={status.color + " p-1 border border-black"}>
                        {status.icon}
                      </span>
                      <span className="font-inter text-xs font-medium">
                        {status.label}
                      </span>
                    </div>
                    <div className="hidden md:flex col-span-2 px-4 py-4 border-l-[3px] border-black items-center">
                      <span className="font-inter text-xs">
                        {budgetLabels[commission.budget || "undisclosed"]}
                      </span>
                    </div>
                    <div className="col-span-3 md:col-span-2 px-4 py-4 border-l-[3px] border-black flex items-center gap-2">
                      {commission.status === "draft" && (
                        <button
                          onClick={() =>
                            submitMutation.mutate({ id: commission.id })
                          }
                          className="p-1.5 bg-[#F9FF00] border border-black hover:bg-[#1a1a1a] hover:text-white transition-colors"
                          title="Submit Request"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      <Link
                        to={`/commission/${commission.id}`}
                        className="p-1.5 border border-black hover:bg-[#1a1a1a] hover:text-white transition-colors"
                        title="View Details"
                      >
                        <FileText size={14} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm("Delete this inquiry request?")) {
                            deleteMutation.mutate({ id: commission.id });
                          }
                        }}
                        className="p-1.5 border border-black hover:bg-[#FF0004] hover:text-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border-[3px] border-black p-12 text-center">
              <FileText size={32} className="mx-auto mb-4 text-[#1a1a1a]/20" />
              <h3 className="font-oswald text-xl font-bold uppercase tracking-tight mb-2">
                NO INQUIRIES YET
              </h3>
              <p className="font-inter text-sm text-[#1a1a1a]/60 mb-6">
                Start your first acquisition inquiry to see it here.
              </p>
              <Link to="/" className="btn-brutal btn-brutal-yellow">
                INQUIRE FOR ACQUISITION
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
