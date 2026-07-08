import { useState, useEffect, useRef } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Send, X } from "lucide-react";

export function ChatWidget() {
  const { state } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCommissionId, setSelectedCommissionId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Don't render chat widget if user is not logged in or is admin (admin uses the dashboard)
  if (state.status !== "authenticated" || state.user.role === "admin") {
    return null;
  }

  // Fetch client's commissions to allow them to chat about specific inquiries
  const commissionsQuery = trpc.commission.list.useQuery(
    { limit: 50 },
    { enabled: isOpen }
  );

  // Fetch message thread based on selected commission (or general thread)
  const messagesQuery = trpc.message.list.useQuery(
    selectedCommissionId ? { commissionId: selectedCommissionId, limit: 100 } : { limit: 100 },
    {
      enabled: isOpen,
      // Poll every 4 seconds to fetch new staff replies in real-time
      refetchInterval: 4000,
    }
  );

  const createMessage = trpc.message.create.useMutation({
    onSuccess: () => {
      setMessageText("");
      messagesQuery.refetch();
    },
  });

  // Scroll to bottom when message list loads/updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesQuery.data?.items, isOpen]);

  const activeMessages = [...(messagesQuery.data?.items ?? [])].reverse();

  // If a commission is selected, filter messages matching that commission ID
  // (In case the general query returned mixed general messages)
  const filteredMessages = selectedCommissionId
    ? activeMessages.filter((m) => m.commissionId === selectedCommissionId)
    : activeMessages.filter((m) => m.commissionId === null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || createMessage.isPending) return;
    createMessage.mutate({
      content: messageText.trim(),
      commissionId: selectedCommissionId,
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[999] bg-[#1a1a1a] text-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(249,255,0,1)] hover:bg-[#F9FF00] hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-oswald text-xs font-bold uppercase tracking-widest flex items-center gap-2"
        aria-label="Open Studio Messenger"
      >
        <MessageSquare size={16} />
        {isOpen ? "Close Chat" : "Studio Chat"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[999] w-[350px] md:w-[400px] h-[500px] bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col font-inter text-[#1a1a1a]">
          {/* Header */}
          <div className="bg-[#1a1a1a] text-white p-4 border-b-[3px] border-black flex items-center justify-between">
            <div>
              <h3 className="font-oswald text-sm font-bold uppercase tracking-widest text-[#F9FF00]">
                STUDIO MESSENGER
              </h3>
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">
                Support & Advisory
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/75 hover:text-[#FF0004] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Thread / Commission Selector */}
          <div className="p-3 border-b-[2px] border-black bg-gray-50 flex flex-col gap-1.5">
            <span className="font-oswald text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/60">
              Select Conversation Topic:
            </span>
            <select
              value={selectedCommissionId === null ? "" : selectedCommissionId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCommissionId(val === "" ? null : Number(val));
              }}
              className="w-full border-[2px] border-black bg-white px-2 py-1 font-oswald text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer"
            >
              <option value="">General Chat & Announcements</option>
              {commissionsQuery.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  Commission #{c.id}: {c.title.slice(0, 25)}...
                </option>
              ))}
            </select>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
            {messagesQuery.isLoading ? (
              <div className="flex justify-center items-center h-full">
                <span className="font-oswald text-xs uppercase tracking-widest text-[#1a1a1a]/50">
                  Loading thread...
                </span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-center p-6 space-y-2 border-[2px] border-dashed border-black/20 bg-white">
                <MessageSquare size={24} className="text-[#1a1a1a]/30" />
                <p className="font-oswald text-xs uppercase tracking-widest text-[#1a1a1a]/60 font-bold">
                  No messages yet
                </p>
                <p className="text-[10px] text-[#1a1a1a]/50 leading-relaxed">
                  {selectedCommissionId
                    ? "Send a message regarding this commission inquiry. Studio managers will reply here."
                    : "Post a message or check here for announcements from the gallery advisors."}
                </p>
              </div>
            ) : (
              filteredMessages.map((m) => {
                const isMe = m.userId === state.user.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="font-oswald text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/50">
                        {m.isStaffReply ? "Studio Advisor" : m.userName || "You"}
                      </span>
                      {m.isStaffReply && (
                        <span className="bg-[#FF0004] text-white text-[7px] font-bold uppercase tracking-widest px-1 py-0.2">
                          STAFF
                        </span>
                      )}
                      <span className="text-[8px] text-[#1a1a1a]/40">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] border-[2px] border-black p-3 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                        isMe
                          ? "bg-white text-[#1a1a1a]"
                          : "bg-[#F9FF00] text-black"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Footer */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t-[3px] border-black bg-white flex gap-2"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={
                selectedCommissionId
                  ? "Write to project managers..."
                  : "Send message to studio..."
              }
              className="flex-1 border-[2px] border-black px-3 py-2 text-xs outline-none focus:bg-gray-50"
              disabled={createMessage.isPending}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || createMessage.isPending}
              className="bg-[#F9FF00] text-black border-[2px] border-black px-4 hover:bg-black hover:text-[#F9FF00] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
