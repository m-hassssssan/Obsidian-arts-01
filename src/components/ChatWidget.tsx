import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  User,
  Shield,
} from "lucide-react";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { isAuthenticated, user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: messages, isLoading } = trpc.message.list.useQuery(undefined, {
    enabled: isOpen && isAuthenticated,
    refetchInterval: isOpen ? 10000 : false,
  });

  const sendMutation = trpc.message.create.useMutation({
    onSuccess: () => {
      utils.message.list.invalidate();
      setMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;
    sendMutation.mutate({ content: message.trim() });
  };

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#1a1a1a] text-white border-[3px] border-black flex items-center justify-center hover:bg-[#F9FF00] hover:text-black transition-all shadow-lg"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-100px)] bg-white border-[3px] border-black flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] text-white border-b-[3px] border-black">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#F9FF00]" />
              <span className="font-oswald text-sm font-bold uppercase tracking-wider">
                Gallery Concierge
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-[#F9FF00] transition-colors"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-[#FF0004] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
            {!isAuthenticated ? (
              <div className="text-center py-8">
                <MessageCircle
                  size={32}
                  className="mx-auto mb-3 text-[#1a1a1a]/20"
                />
                <p className="font-inter text-sm text-[#1a1a1a]/60 mb-4">
                  Log in to consult with our gallery advisors
                </p>
                <Link
                  to="/login"
                  className="btn-brutal btn-brutal-yellow text-xs py-2 px-4"
                >
                  LOG IN
                </Link>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <span className="font-oswald text-xs uppercase tracking-widest text-[#1a1a1a]/40">
                  Loading messages...
                </span>
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.userId === user?.id ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 flex-shrink-0 flex items-center justify-center border-[3px] border-black ${
                      msg.isStaffReply
                        ? "bg-[#FF0004] text-white"
                        : "bg-[#F9FF00]"
                    }`}
                  >
                    {msg.isStaffReply ? (
                      <Shield size={12} />
                    ) : (
                      <User size={12} />
                    )}
                  </div>
                  <div
                    className={`max-w-[75%] px-3 py-2 border-[3px] border-black ${
                      msg.userId === user?.id
                        ? "bg-[#1a1a1a] text-white"
                        : "bg-white"
                    }`}
                  >
                    <p className="font-inter text-xs leading-relaxed">
                      {msg.content}
                    </p>
                    <span className="font-inter text-[9px] opacity-50 mt-1 block">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle
                  size={32}
                  className="mx-auto mb-3 text-[#1a1a1a]/20"
                />
                <p className="font-inter text-sm text-[#1a1a1a]/60">
                  No messages yet.
                </p>
                <p className="font-inter text-xs text-[#1a1a1a]/40 mt-1">
                  Ask us anything about artwork acquisitions or private viewings!
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {isAuthenticated && (
            <form
              onSubmit={handleSend}
              className="border-t-[3px] border-black p-3 bg-white flex gap-2"
            >
              <input
                type="text"
                className="flex-1 border-[3px] border-black px-3 py-2 font-inter text-xs outline-none focus:border-[#FF0004] transition-colors"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={!message.trim() || sendMutation.isPending}
                className="btn-brutal btn-brutal-yellow px-3 py-2 disabled:opacity-30"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
