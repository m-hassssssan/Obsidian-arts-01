import { useState, useEffect, useRef } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Send, X, Megaphone, Bell } from "lucide-react";

export function ChatWidget() {
  const { state } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [selectedCommissionId, setSelectedCommissionId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = state.status === "authenticated";
  const isUser = isAuthenticated && state.user.role !== "admin";

  // ALL hooks must be called unconditionally — no hooks after any early return
  const commissionsQuery = trpc.commission.list.useQuery(
    { limit: 50 },
    { enabled: isUser && isOpen }
  );

  const messagesQuery = trpc.message.list.useQuery(
    selectedCommissionId ? { commissionId: selectedCommissionId, limit: 100 } : { limit: 100 },
    {
      enabled: isUser && (isOpen || isAnnouncementsOpen),
      refetchInterval: 4000,
    }
  );

  const createMessage = trpc.message.create.useMutation({
    onSuccess: () => {
      setMessageText("");
      messagesQuery.refetch();
    },
  });

  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesQuery.data?.items, isOpen]);

  // Don't render chat widget if user is not logged in or is admin (admin uses the dashboard)
  if (!isUser) {
    return null;
  }

  const allMessages = messagesQuery.data?.items ?? [];
  const announcements = allMessages
    .filter((m) => m.isAnnouncement)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadAnnouncements = announcements.length;

  const activeMessages = [...allMessages].reverse();

  const filteredMessages = selectedCommissionId
    ? activeMessages.filter((m) => m.commissionId === selectedCommissionId)
    : activeMessages.filter((m) => {
        // Never show announcements in chat — they have their own panel
        if (m.isAnnouncement) return false;
        // Commission staff replies shown when that commission is selected
        if (m.commissionId) return false;
        // General chat: user's own messages + direct staff replies to this user
        return true;
      });

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


      {/* ── Announcements Panel ── */}
      {isAnnouncementsOpen && (
        <div className="fixed bottom-24 right-[198px] z-[998] w-[340px] md:w-[390px] bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col font-inter text-[#1a1a1a] max-h-[70vh]">
          <div className="bg-[#FF0004] text-white p-4 border-b-[3px] border-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={14} />
              <h3 className="font-oswald text-sm font-bold uppercase tracking-widest">
                Studio Announcements
              </h3>
            </div>
            <button
              onClick={() => setIsAnnouncementsOpen(false)}
              className="text-white/75 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
            {messagesQuery.isLoading ? (
              <p className="font-oswald text-xs uppercase tracking-widest text-[#1a1a1a]/50 text-center py-6">Loading…</p>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <Megaphone size={28} className="text-[#1a1a1a]/20" />
                <p className="font-oswald text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold">
                  No announcements yet
                </p>
                <p className="text-[10px] text-[#1a1a1a]/40 leading-relaxed">
                  Gallery advisors will post updates here.
                </p>
              </div>
            ) : (
              announcements.map((m) => (
                <div key={m.id} className="border-[2px] border-black bg-[#F9FF00] p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="bg-[#FF0004] text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 font-oswald">
                      STUDIO
                    </span>
                    <span className="ml-auto text-[9px] text-[#1a1a1a]/50 font-inter">
                      {new Date(m.createdAt).toLocaleDateString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="font-inter text-xs whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Bottom-right button strip: Announcements + Studio Chat ── */}
      <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-2">
        {/* Announcements button */}
        <button
          onClick={() => {
            setIsAnnouncementsOpen(!isAnnouncementsOpen);
            setIsOpen(false);
          }}
          className="bg-[#FF0004] text-white border-[3px] border-black px-4 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#cc0003] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-oswald text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          aria-label="Studio Announcements"
        >
          <Megaphone size={16} />
          Announcements
          {unreadAnnouncements > 0 && (
            <span className="bg-[#F9FF00] text-black text-[9px] font-bold px-1.5 py-0.5 border border-black">
              {unreadAnnouncements}
            </span>
          )}
        </button>

        {/* Studio Chat button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setIsAnnouncementsOpen(false);
          }}
          className="bg-[#1a1a1a] text-white border-[3px] border-black px-4 py-4 shadow-[4px_4px_0px_0px_rgba(249,255,0,1)] hover:bg-[#F9FF00] hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-oswald text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          aria-label="Open Studio Messenger"
        >
          <MessageSquare size={16} />
          {isOpen ? "Close Chat" : "Studio Chat"}
        </button>
      </div>

      {/* ── Chat Window ── */}
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
              <option value="">General Chat & Direct Messages</option>
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
                    : "Send a message to the studio. Advisors will reply directly here."}
                </p>
              </div>
            ) : (
              filteredMessages.map((m) => {
                const isMe = m.userId === state.user.id && !m.isStaffReply;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="font-oswald text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/50">
                        {m.isStaffReply ? "Studio Advisor" : "You"}
                      </span>
                      {m.isStaffReply && (
                        <span className="bg-[#FF0004] text-white text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 font-oswald">
                          STAFF
                        </span>
                      )}
                      {m.commissionId && (
                        <span className="text-[8px] text-[#1a1a1a]/40 font-inter">
                          · Commission #{m.commissionId}
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
