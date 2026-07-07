import { useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Send,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  FileText,
  Milestone,
  AlertCircle,
  Pencil,
  X,
} from "lucide-react";

const STATUS_OPTIONS = [
  "draft",
  "submitted",
  "inReview",
  "approved",
  "inProgress",
  "revision",
  "completed",
  "cancelled",
] as const;

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

export default function AdminCommissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const commissionId = parseInt(id ?? "0", 10);
  const utils = trpc.useUtils();

  const query = trpc.admin.getCommission.useQuery({ id: commissionId });
  const updateStatus = trpc.admin.updateStatus.useMutation({
    onSuccess: () => utils.admin.getCommission.invalidate({ id: commissionId }),
  });
  const addEvent = trpc.admin.addEvent.useMutation({
    onSuccess: () => utils.admin.getCommission.invalidate({ id: commissionId }),
  });
  const reply = trpc.admin.replyToCommission.useMutation({
    onSuccess: () => utils.admin.getCommission.invalidate({ id: commissionId }),
  });
  const updateCommission = trpc.admin.updateCommission.useMutation({
    onSuccess: () => utils.admin.getCommission.invalidate({ id: commissionId }),
  });
  const deleteCommission = trpc.admin.deleteCommission.useMutation({
    onSuccess: () => navigate("/admin/commissions"),
  });

  const [statusNote, setStatusNote] = useState("");
  const [eventType, setEventType] = useState<"note" | "message" | "file" | "milestone">("note");
  const [eventContent, setEventContent] = useState("");
  const [replyContent, setReplyContent] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    projectType: string;
    budget: string;
    rightsUsage: string;
    deadline: string;
    notes: string;
  }>({ title: "", projectType: "", budget: "", rightsUsage: "", deadline: "", notes: "" });

  const startedEdit = useRef(false);

  function startEdit() {
    if (!query.data || startedEdit.current) return;
    startedEdit.current = true;
    setEditing(true);
    setEditForm({
      title: query.data.title,
      projectType: query.data.projectType,
      budget: query.data.budget ?? "undisclosed",
      rightsUsage: query.data.rightsUsage ?? "toBeDiscussed",
      deadline: query.data.deadline
        ? new Date(query.data.deadline).toISOString().slice(0, 10)
        : "",
      notes: query.data.notes ?? "",
    });
  }

  if (!commissionId) {
    return <div className="p-10">Invalid commission id.</div>;
  }

  if (query.isLoading) {
    return <div className="p-10 font-inter text-sm">Loading…</div>;
  }

  if (query.error || !query.data) {
    return (
      <div className="p-10">
        <div className="border-[3px] border-[#FF0004] bg-[#FF0004]/5 p-6">
          <h2 className="font-oswald text-lg font-bold uppercase text-[#FF0004]">
            Commission not found
          </h2>
          <Link
            to="/admin/commissions"
            className="mt-4 inline-block font-oswald text-xs font-bold uppercase tracking-widest hover:underline"
          >
            ← Back to list
          </Link>
        </div>
      </div>
    );
  }

  const c = query.data;

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/admin/commissions"
          className="inline-flex items-center gap-2 font-oswald text-xs font-bold uppercase tracking-widest hover:text-[#FF0004]"
        >
          <ArrowLeft size={14} /> ALL COMMISSIONS
        </Link>
        <button
          onClick={() => {
            if (
              confirm(
                `Delete commission "${c.title}"? This action cannot be undone.`,
              )
            ) {
              deleteCommission.mutate({ id: c.id });
            }
          }}
          className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#FF0004] hover:underline flex items-center gap-1"
        >
          <Trash2 size={12} /> DELETE
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left – main details */}
        <div className="lg:col-span-8 space-y-6">
          <section className="border-[3px] border-black bg-white p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50 mb-1">
                  COMMISSION #{c.id}
                </div>
                {editing ? (
                  <input
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="font-oswald text-3xl font-bold uppercase tracking-tight border-[2px] border-black px-2 py-1 w-full"
                  />
                ) : (
                  <h1 className="font-oswald text-3xl md:text-4xl font-bold uppercase tracking-[-0.02em]">
                    {c.title}
                  </h1>
                )}
              </div>
              <span
                className={`inline-block border-[3px] px-3 py-1 font-oswald text-xs font-bold uppercase whitespace-nowrap ${
                  STATUS_COLORS[c.status ?? ""] ?? ""
                }`}
              >
                {humanize(c.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t-[3px] border-black pt-4">
              <DetailCell label="Type" value={humanize(c.projectType)} />
              <DetailCell label="Budget" value={humanizeBudget(c.budget)} />
              <DetailCell label="Rights" value={humanize(c.rightsUsage)} />
              <DetailCell
                label="Deadline"
                value={
                  c.deadline
                    ? new Date(c.deadline).toLocaleDateString()
                    : "—"
                }
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
              <DetailCell
                label="Created"
                value={new Date(c.createdAt).toLocaleString()}
              />
              <DetailCell
                label="Updated"
                value={new Date(c.updatedAt).toLocaleString()}
              />
              <DetailCell
                label="Visual refs"
                value={String(c.visualReferences?.length ?? 0)}
              />
              <DetailCell
                label="Deliverables"
                value={String(c.deliverables?.length ?? 0)}
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              {!editing ? (
                <button
                  onClick={startEdit}
                  className="btn-brutal btn-brutal-black text-xs flex items-center gap-1"
                >
                  <Pencil size={12} /> EDIT
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      updateCommission.mutate({
                        id: c.id,
                        title: editForm.title,
                        projectType: editForm.projectType as any,
                        budget: editForm.budget as any,
                        rightsUsage: editForm.rightsUsage as any,
                        deadline: editForm.deadline || null,
                        notes: editForm.notes || undefined,
                      });
                      setEditing(false);
                      startedEdit.current = false;
                    }}
                    className="btn-brutal btn-brutal-yellow text-xs flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} /> SAVE
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      startedEdit.current = false;
                    }}
                    className="btn-brutal btn-brutal-black text-xs flex items-center gap-1"
                  >
                    <X size={12} /> CANCEL
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Description + deliverables */}
          <section className="border-[3px] border-black bg-white p-6">
            <h2 className="font-oswald text-lg font-bold uppercase tracking-tight mb-3">
              Description
            </h2>
            <p className="font-inter text-sm leading-relaxed whitespace-pre-wrap">
              {c.description || "No description provided."}
            </p>
            {!!c.deliverables?.length && (
              <>
                <h3 className="font-oswald text-sm font-bold uppercase tracking-widest mt-6 mb-2">
                  Deliverables
                </h3>
                <ul className="space-y-1">
                  {c.deliverables.map((d, i) => (
                    <li key={i} className="font-inter text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#F9FF00] border border-black mt-2 flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {!!c.visualReferences?.length && (
              <>
                <h3 className="font-oswald text-sm font-bold uppercase tracking-widest mt-6 mb-2">
                  Visual References
                </h3>
                <ul className="space-y-1">
                  {c.visualReferences.map((v, i) => (
                    <li key={i} className="font-inter text-xs">
                      <a
                        href={v}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#FF0004] underline break-all"
                      >
                        {v}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {editing && (
              <div className="mt-6 space-y-3 border-t-[3px] border-black pt-4">
                <div>
                  <label className="font-oswald text-[10px] font-bold uppercase tracking-widest block mb-1">
                    Internal Notes
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    className="input-brutal min-h-[100px] w-full text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldSelect
                    label="Project Type"
                    value={editForm.projectType}
                    onChange={(v) =>
                      setEditForm({ ...editForm, projectType: v })
                    }
                    options={[
                      "editorial",
                      "brand",
                      "publishing",
                      "packaging",
                      "motion",
                      "other",
                    ]}
                  />
                  <FieldSelect
                    label="Budget"
                    value={editForm.budget}
                    onChange={(v) => setEditForm({ ...editForm, budget: v })}
                    options={[
                      "under5k",
                      "5to10k",
                      "10to25k",
                      "25to50k",
                      "over50k",
                      "undisclosed",
                    ]}
                  />
                  <FieldSelect
                    label="Rights"
                    value={editForm.rightsUsage}
                    onChange={(v) =>
                      setEditForm({ ...editForm, rightsUsage: v })
                    }
                    options={[
                      "oneTime",
                      "limited",
                      "exclusive",
                      "fullBuyout",
                      "toBeDiscussed",
                    ]}
                  />
                  <div>
                    <label className="font-oswald text-[10px] font-bold uppercase tracking-widest block mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={editForm.deadline}
                      onChange={(e) =>
                        setEditForm({ ...editForm, deadline: e.target.value })
                      }
                      className="input-brutal w-full text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Conversation thread */}
          <section className="border-[3px] border-black bg-white">
            <div className="border-b-[3px] border-black px-6 py-4 flex items-center gap-2">
              <MessageSquare size={16} />
              <h2 className="font-oswald text-lg font-bold uppercase tracking-tight">
                Conversation
              </h2>
              <span className="ml-auto font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50">
                {c.thread.length} message{c.thread.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
              {c.thread.length === 0 ? (
                <p className="font-inter text-sm text-[#1a1a1a]/50">
                  No messages yet.
                </p>
              ) : (
                c.thread.map((m) => (
                  <div
                    key={m.id}
                    className={`border-[2px] border-black p-3 ${
                      m.isStaffReply
                        ? "bg-[#F9FF00] ml-0 md:ml-12"
                        : "bg-white mr-0 md:mr-12"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-oswald text-[10px] font-bold uppercase tracking-widest">
                        {m.isStaffReply ? "Studio" : m.userName || "Patron"}
                        {m.isStaffReply && (
                          <span className="ml-2 bg-[#1a1a1a] text-white px-1.5 py-0.5 text-[9px]">
                            STAFF
                          </span>
                        )}
                      </span>
                      <span className="font-inter text-[10px] text-[#1a1a1a]/50">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-inter text-sm whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!replyContent.trim()) return;
                reply.mutate({
                  commissionId: c.id,
                  content: replyContent,
                });
                setReplyContent("");
              }}
              className="border-t-[3px] border-black p-4 flex items-start gap-3"
            >
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply as the studio…"
                className="input-brutal flex-1 min-h-[60px] text-sm"
              />
              <button
                type="submit"
                disabled={reply.isPending || !replyContent.trim()}
                className="btn-brutal btn-brutal-yellow flex items-center gap-1 text-xs"
              >
                <Send size={12} /> REPLY
              </button>
            </form>
          </section>
        </div>

        {/* Right – sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Patron */}
          <section className="border-[3px] border-black bg-white p-5">
            <h2 className="font-oswald text-xs font-bold uppercase tracking-widest mb-3">
              Patron
            </h2>
            {c.user ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 border-[3px] border-black bg-[#F9FF00] flex items-center justify-center font-oswald font-bold text-lg">
                    {(c.user.name || c.user.email || "P").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-oswald text-sm font-bold uppercase">
                      {c.user.name || "Anonymous"}
                    </div>
                    <div className="font-inter text-xs text-[#1a1a1a]/60 break-all">
                      {c.user.email}
                    </div>
                  </div>
                </div>
                <Link
                  to={`/admin/users?search=${encodeURIComponent(c.user.email ?? "")}`}
                  className="block text-center font-oswald text-[10px] font-bold uppercase tracking-widest py-2 border-[2px] border-black hover:bg-[#F9FF00]"
                >
                  VIEW PROFILE
                </Link>
              </div>
            ) : (
              <p className="font-inter text-sm text-[#1a1a1a]/50">
                No user attached.
              </p>
            )}
          </section>

          {/* Status changer */}
          <section className="border-[3px] border-black bg-white p-5">
            <h2 className="font-oswald text-xs font-bold uppercase tracking-widest mb-3">
              Update Status
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    updateStatus.mutate({ id: c.id, status: s })
                  }
                  disabled={c.status === s || updateStatus.isPending}
                  className={`border-[2px] border-black px-2 py-1 font-oswald text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    c.status === s
                      ? STATUS_COLORS[s]
                      : "bg-white hover:bg-[#F9FF00]"
                  }`}
                >
                  {humanize(s)}
                </button>
              ))}
            </div>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Optional note attached to status change…"
              className="input-brutal w-full min-h-[60px] text-xs"
            />
            <p className="font-inter text-[10px] text-[#1a1a1a]/50 mt-2">
              Tip: Click a status above; the note is attached to the event.
            </p>
          </section>

          {/* Timeline */}
          <section className="border-[3px] border-black bg-white p-5">
            <h2 className="font-oswald text-xs font-bold uppercase tracking-widest mb-3">
              Timeline
            </h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {c.events.length === 0 ? (
                <p className="font-inter text-xs text-[#1a1a1a]/50">
                  No events yet.
                </p>
              ) : (
                c.events.map((e) => <EventRow key={e.id} event={e} />)
              )}
            </div>
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                if (!eventContent.trim()) return;
                addEvent.mutate({
                  commissionId: c.id,
                  type: eventType,
                  content: eventContent,
                });
                setEventContent("");
              }}
              className="mt-3 border-t-[2px] border-black pt-3 space-y-2"
            >
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="border-[2px] border-black bg-white px-2 py-1 font-oswald text-[10px] font-bold uppercase w-full"
              >
                <option value="note">Note</option>
                <option value="message">Message</option>
                <option value="file">File</option>
                <option value="milestone">Milestone</option>
              </select>
              <textarea
                value={eventContent}
                onChange={(e) => setEventContent(e.target.value)}
                placeholder="Add a timeline event…"
                className="input-brutal w-full min-h-[50px] text-xs"
              />
              <button
                type="submit"
                disabled={!eventContent.trim() || addEvent.isPending}
                className="btn-brutal btn-brutal-black w-full text-xs flex items-center justify-center gap-1"
              >
                <Plus size={12} /> ADD EVENT
              </button>
            </form>
          </section>

          {c.notes && (
            <section className="border-[3px] border-black bg-[#F9FF00] p-5">
              <h2 className="font-oswald text-xs font-bold uppercase tracking-widest mb-2">
                Internal Notes
              </h2>
              <p className="font-inter text-sm whitespace-pre-wrap">{c.notes}</p>
            </section>
          )}

          {(updateStatus.error ||
            addEvent.error ||
            reply.error ||
            updateCommission.error ||
            deleteCommission.error) && (
            <div className="border-[3px] border-[#FF0004] bg-[#FF0004]/5 p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-[#FF0004] mt-0.5" />
              <p className="font-inter text-xs text-[#FF0004]">
                {updateStatus.error?.message ??
                  addEvent.error?.message ??
                  reply.error?.message ??
                  updateCommission.error?.message ??
                  deleteCommission.error?.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/50">
        {label}
      </div>
      <div className="font-oswald text-sm font-bold uppercase">{value}</div>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="font-oswald text-[10px] font-bold uppercase tracking-widest block mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-[2px] border-black bg-white px-2 py-1 font-oswald text-xs uppercase w-full"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {humanize(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

function EventRow({
  event,
}: {
  event: {
    id: number;
    type: string;
    content: string;
    createdAt: Date | string;
    createdByName?: string | null;
    createdByEmail?: string | null;
  };
}) {
  const icon = (() => {
    switch (event.type) {
      case "statusChange":
        return <Circle size={14} className="text-[#F9FF00] fill-[#F9FF00]" />;
      case "milestone":
        return <Milestone size={14} className="text-[#FF0004]" />;
      case "message":
        return <MessageSquare size={14} className="text-blue-700" />;
      case "file":
        return <FileText size={14} className="text-green-700" />;
      default:
        return <Clock size={14} />;
    }
  })();
  return (
    <div className="border-l-[3px] border-black pl-3">
      <div className="flex items-center gap-2 mb-0.5">
        {icon}
        <span className="font-oswald text-[10px] font-bold uppercase tracking-widest">
          {humanize(event.type)}
        </span>
        <span className="ml-auto font-inter text-[10px] text-[#1a1a1a]/50">
          {new Date(event.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="font-inter text-xs whitespace-pre-wrap">{event.content}</p>
      {event.createdByName && (
        <p className="font-inter text-[10px] text-[#1a1a1a]/50 mt-0.5">
          by {event.createdByName}
        </p>
      )}
    </div>
  );
}

function humanize(s: string | null | undefined): string {
  if (!s) return "—";
  return s
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function humanizeBudget(s: string | null | undefined): string {
  const map: Record<string, string> = {
    under5k: "Under $5K",
    "5to10k": "$5K — $10K",
    "10to25k": "$10K — $25K",
    "25to50k": "$25K — $50K",
    over50k: "Over $50K",
    undisclosed: "Undisclosed",
  };
  return map[s ?? ""] ?? "—";
}
