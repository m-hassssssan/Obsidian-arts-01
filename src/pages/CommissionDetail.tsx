import { useParams, Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Navigation } from "@/components/Navigation";
import {
  ArrowLeft,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  ImageIcon,
  Send,
  Download,
  CheckCircle2,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  draft: "Draft Request",
  submitted: "Inquiry Submitted",
  inReview: "Curator Review",
  approved: "Approved",
  inProgress: "Arrangement Phase",
  revision: "Details Review",
  completed: "Acquired",
  cancelled: "Withdrawn",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100",
  submitted: "bg-[#F9FF00]",
  inReview: "bg-blue-100",
  approved: "bg-green-100",
  inProgress: "bg-purple-100",
  revision: "bg-orange-100",
  completed: "bg-green-200",
  cancelled: "bg-red-100",
};

const budgetLabels: Record<string, string> = {
  under5k: "Under $5,000",
  "5to10k": "$5,000 — $10,000",
  "10to25k": "$10,000 — $25,000",
  "25to50k": "$25,000 — $50,000",
  over50k: "Over $50,000",
  undisclosed: "Prefer not to say",
};

const rightsLabels: Record<string, string> = {
  oneTime: "Private Collection",
  limited: "Corporate Display",
  exclusive: "Museum / Institutional Exhibition",
  fullBuyout: "Permanent Acquisition",
  toBeDiscussed: "To Be Discussed",
};

const projectTypeLabels: Record<string, string> = {
  editorial: "PAINTING & CANVAS",
  brand: "SCULPTURE & FORM",
  publishing: "DIGITAL & NEW MEDIA",
  packaging: "AVANT-GARDE PHOTOGRAPHY",
  motion: "KINETIC & MOTION ART",
  other: "OTHER / MIXED MEDIA",
};

export default function CommissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const utils = trpc.useUtils();

  const { data: commission, isLoading: commissionLoading } =
    trpc.commission.getById.useQuery(
      { id: Number(id) },
      { enabled: !!id && isAuthenticated }
    );

  const submitMutation = trpc.commission.submit.useMutation({
    onSuccess: () => {
      utils.commission.getById.invalidate({ id: Number(id) });
      utils.commission.list.invalidate();
    },
  });

  const handleDownloadSummary = () => {
    if (!commission) return;
    const summary = {
      title: commission.title,
      projectType: projectTypeLabels[commission.projectType] || commission.projectType,
      status: commission.status,
      description: commission.description,
      deliverables: commission.deliverables,
      deadline: commission.deadline,
      budget: budgetLabels[commission.budget || "undisclosed"],
      rightsUsage: rightsLabels[commission.rightsUsage || "toBeDiscussed"],
      visualReferences: commission.visualReferences,
      createdAt: commission.createdAt,
      updatedAt: commission.updatedAt,
      events: commission.events || [],
    };
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acquisition-inquiry-${commission.id}-summary.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || commissionLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="font-oswald text-xl uppercase tracking-widest">
          Loading...
        </div>
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-24 px-6 text-center">
          <h2 className="font-oswald text-3xl font-bold uppercase mb-4">
            Acquisition inquiry not found
          </h2>
          <Link to="/dashboard" className="btn-brutal btn-brutal-yellow">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="pt-20 pb-16 px-6 md:px-12 lg:px-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-oswald text-sm uppercase tracking-wider hover:text-[#FF0004] transition-colors"
          >
            <ArrowLeft size={16} />
            Patron Dashboard
          </Link>
          <span className="text-[#1a1a1a]/30">/</span>
          <span className="font-oswald text-sm uppercase tracking-wider">
            Inquiry #{commission.id}
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`px-3 py-1 font-oswald text-xs font-bold uppercase tracking-wider border-[3px] border-black ${statusColors[commission.status || "draft"]}`}
              >
                {statusLabels[commission.status || "draft"]}
              </span>
              <span className="font-inter text-xs text-[#1a1a1a]/50">
                Created{" "}
                {commission.createdAt
                  ? new Date(commission.createdAt).toLocaleDateString()
                  : ""}
              </span>
            </div>
            <h1 className="font-oswald text-3xl md:text-5xl font-bold uppercase tracking-[-0.03em]">
              {commission.title}
            </h1>
          </div>
          <div className="flex gap-3">
            {commission.status === "draft" && (
              <button
                onClick={() => submitMutation.mutate({ id: commission.id })}
                disabled={submitMutation.isPending}
                className="btn-brutal btn-brutal-yellow flex items-center gap-2"
              >
                <Send size={16} />
                {submitMutation.isPending ? "SUBMITTING..." : "SUBMIT"}
              </button>
            )}
            <button
              onClick={handleDownloadSummary}
              className="btn-brutal btn-brutal-black flex items-center gap-2"
            >
              <Download size={16} />
              SUMMARY
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-[3px] border-black">
          {/* Left Column - Details */}
          <div className="lg:col-span-8 border-r-[3px] border-black">
            {/* Description */}
            {commission.description && (
              <div className="border-b-[3px] border-black p-6">
                <h3 className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#FF0004] mb-3">
                  Description
                </h3>
                <p className="font-inter text-sm leading-relaxed">
                  {commission.description}
                </p>
              </div>
            )}

            {/* Deliverables */}
            {commission.deliverables && commission.deliverables.length > 0 && (
              <div className="border-b-[3px] border-black p-6">
                <h3 className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#FF0004] mb-3">
                  Patron & Gallery Services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(commission.deliverables as string[]).map((d, i) => (
                    <span
                      key={i}
                      className="font-inter text-xs border-[3px] border-black px-3 py-1.5 bg-[#F9FF00]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Visual References */}
            {commission.visualReferences &&
              commission.visualReferences.length > 0 && (
                <div className="border-b-[3px] border-black p-6">
                  <h3 className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#FF0004] mb-3">
                    Visual References
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(commission.visualReferences as string[]).map((ref, i) => (
                      <a
                        key={i}
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-inter text-xs border-[3px] border-black px-3 py-1.5 hover:bg-[#F9FF00] transition-colors flex items-center gap-1"
                      >
                        <ImageIcon size={12} />
                        Ref {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

            {/* Timeline */}
            <div className="p-6">
              <h3 className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#FF0004] mb-4">
                Activity Timeline
              </h3>
              {commission.events && commission.events.length > 0 ? (
                <div className="space-y-0">
                  {commission.events.map((event, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 pb-4 border-l-[3px] border-black pl-6 relative"
                    >
                      <div className="absolute -left-[7px] top-0 w-3 h-3 bg-[#F9FF00] border-[3px] border-black" />
                      <div>
                        <p className="font-inter text-sm">{event.content}</p>
                        <p className="font-inter text-[10px] text-[#1a1a1a]/50 mt-1">
                          {event.createdAt
                            ? new Date(event.createdAt).toLocaleString()
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-inter text-sm text-[#1a1a1a]/50">
                  No activity yet.
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-4 bg-[#fafafa]">
            <div className="border-b-[3px] border-black p-6">
              <h3 className="font-oswald text-lg font-bold uppercase tracking-tight mb-4">
                INQUIRY DETAILS
              </h3>

              <div className="space-y-4">
                <DetailItem
                  icon={<FileText size={16} />}
                  label="Art Medium"
                  value={projectTypeLabels[commission.projectType] || commission.projectType}
                />
                <DetailItem
                  icon={<Calendar size={16} />}
                  label="Expected Acquisition Date"
                  value={
                    commission.deadline
                      ? new Date(commission.deadline).toLocaleDateString()
                      : "Not set"
                  }
                />
                <DetailItem
                  icon={<DollarSign size={16} />}
                  label="Art Valuation / Budget"
                  value={budgetLabels[commission.budget || "undisclosed"]}
                />
                <DetailItem
                  icon={<CheckCircle2 size={16} />}
                  label="Acquisition Intention"
                  value={
                    rightsLabels[commission.rightsUsage || "toBeDiscussed"]
                  }
                />
                <DetailItem
                  icon={<Clock size={16} />}
                  label="Last Updated"
                  value={
                    commission.updatedAt
                      ? new Date(commission.updatedAt).toLocaleDateString()
                      : ""
                  }
                />
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-oswald text-xs font-bold uppercase tracking-[0.2em] text-[#FF0004] mb-3">
                Status Pipeline
              </h4>
              <div className="space-y-0">
                {[
                  "draft",
                  "submitted",
                  "inReview",
                  "approved",
                  "inProgress",
                  "completed",
                ].map((s, i) => {
                  const isActive = commission.status === s;
                  const statusIdx = [
                    "draft",
                    "submitted",
                    "inReview",
                    "approved",
                    "inProgress",
                    "completed",
                  ].indexOf(commission.status || "draft");
                  const isPast = statusIdx >= i;
                  return (
                    <div
                      key={s}
                      className={`flex items-center gap-3 py-2 border-b border-black/10 last:border-b-0 ${
                        isActive ? "font-bold" : ""
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border-[3px] border-black flex-shrink-0 ${
                          isActive
                            ? "bg-[#F9FF00]"
                            : isPast
                            ? "bg-[#1a1a1a]"
                            : "bg-white"
                        }`}
                      />
                      <span className="font-inter text-xs uppercase tracking-wider">
                        {statusLabels[s]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#1a1a1a]/40">{icon}</div>
      <div>
        <div className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">
          {label}
        </div>
        <div className="font-inter text-sm">{value}</div>
      </div>
    </div>
  );
}
