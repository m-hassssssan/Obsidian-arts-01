import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Send, Trash2, MessageSquare, Filter } from "lucide-react";

export default function AdminMessages() {
  const [filter, setFilter] = useState<"all" | "commissioned" | "unassigned">(
    "all",
  );
  const query = trpc.message.list.useQuery({ limit: 200 });
  const deleteMutation = trpc.message.delete.useMutation({
    onSuccess: () => query.refetch(),
  });
  const utils = trpc.useUtils();
  const createMutation = trpc.message.create.useMutation({
    onSuccess: () => {
      utils.message.list.invalidate();
      setNewContent("");
    },
  });

  const [newContent, setNewContent] = useState("");

  if (query.isLoading) {
    return <div className="p-10 font-inter text-sm">Loading…</div>;
  }

  if (query.error) {
    return (
      <div className="p-10">
        <div className="border-[3px] border-[#FF0004] bg-[#FF0004]/5 p-4 font-inter text-sm text-[#FF0004]">
          {query.error.message}
        </div>
      </div>
    );
  }

  let items = query.data?.items ?? [];
  if (filter === "commissioned") {
    items = items.filter((m) => m.commissionId);
  } else if (filter === "unassigned") {
    items = items.filter((m) => !m.commissionId);
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="font-inter text-sm text-[#1a1a1a]/60">
          {items.length} message{items.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2 border-[2px] border-black bg-white">
          <Filter size={14} className="ml-3 text-[#1a1a1a]/50" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-2 py-1 font-oswald text-[10px] font-bold uppercase tracking-widest bg-transparent outline-none"
          >
            <option value="all">All</option>
            <option value="commissioned">Commissioned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      <section className="border-[3px] border-black bg-white p-5">
        <h2 className="font-oswald text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
          <MessageSquare size={14} /> NEW MESSAGE
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newContent.trim()) return;
            createMutation.mutate({ content: newContent, commissionId: null });
          }}
          className="flex items-start gap-3"
        >
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write a public studio announcement (visible to all users)…"
            className="input-brutal flex-1 min-h-[60px] text-sm"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newContent.trim()}
            className="btn-brutal btn-brutal-yellow flex items-center gap-1 text-xs"
          >
            <Send size={12} /> POST
          </button>
        </form>
      </section>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="border-[3px] border-black bg-white p-12 text-center">
            <p className="font-oswald text-sm uppercase tracking-widest text-[#1a1a1a]/40">
              No messages
            </p>
          </div>
        )}
        {items.map((m) => (
          <div
            key={m.id}
            className={`border-[3px] border-black p-4 ${
              m.isStaffReply ? "bg-[#F9FF00]" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-oswald text-xs font-bold uppercase">
                {m.isStaffReply ? "Studio" : m.userName || "Patron"}
              </span>
              {m.isStaffReply && (
                <span className="bg-[#1a1a1a] text-white px-1.5 py-0.5 font-oswald text-[9px] font-bold uppercase">
                  STAFF
                </span>
              )}
              {m.userRole === "admin" && (
                <span className="bg-[#FF0004] text-white px-1.5 py-0.5 font-oswald text-[9px] font-bold uppercase">
                  ADMIN
                </span>
              )}
              {m.commissionId ? (
                <span className="ml-2 font-inter text-[10px] text-[#1a1a1a]/60">
                  → commission #{m.commissionId}
                </span>
              ) : (
                <span className="ml-2 font-inter text-[10px] text-[#1a1a1a]/60">
                  (general inbox)
                </span>
              )}
              <span className="ml-auto font-inter text-[10px] text-[#1a1a1a]/50">
                {new Date(m.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="font-inter text-sm whitespace-pre-wrap">{m.content}</p>
            <div className="mt-2 flex items-center justify-end">
              <button
                onClick={() => {
                  if (confirm("Delete this message?")) {
                    deleteMutation.mutate({ id: m.id });
                  }
                }}
                className="font-oswald text-[10px] font-bold uppercase tracking-widest text-[#FF0004] hover:underline flex items-center gap-1"
              >
                <Trash2 size={10} /> DELETE
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
