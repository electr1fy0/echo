import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useMessages, useSendMessage, useConversations } from "@/hooks/use-dms";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition } from "@/components/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { formatRelativeTime } from "@/lib/format-time";

export default function DMConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { data: messages, isLoading } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const { mutate: send, isPending } = useSendMessage(conversationId);
  const { data: user } = useAuth();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = conversations?.find((c) => c.uid === conversationId);
  const otherUser = conversation?.otherUsername;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isPending) return;
    send(input.trim(), {
      onSuccess: () => setInput(""),
      onError: () => {},
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversationId) return null;

  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 px-4 pb-4 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/dm")}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5 text-neutral-500" />
        </button>
        {otherUser && (
          <Link to={`/u/${otherUser}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <UserAvatar src={conversation?.otherAvatar} name={otherUser} className="size-8" />
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {otherUser}
            </span>
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-0 scrollbar-none">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton className={`h-10 w-3/4 rounded-2xl ${i % 2 === 0 ? "rounded-bl-sm" : "rounded-br-sm"}`} />
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-1.5">
            {messages.map((msg) => {
              const isMine = msg.sender === user?.username;
              return (
                <div key={msg.uid} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] flex flex-col">
                    <div
                      className={`px-3.5 py-2 text-sm leading-relaxed ${
                        isMine
                          ? "bg-[#ff5a1f] text-white rounded-2xl rounded-br-sm"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className={`text-[10px] text-neutral-400 mt-0.5 ${isMine ? "text-right mr-1" : "ml-1"}`}>
                      {formatRelativeTime(new Date(msg.timeCreated))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-500 h-full">
            No messages yet. Say hello!
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 items-end shrink-0">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[44px] max-h-[120px] text-sm resize-none"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={isPending || !input.trim()}
          className="bg-[#ff5a1f] hover:bg-[#e94a12] text-white border-none h-[44px] shrink-0"
        >
          Send
        </Button>
      </div>
    </PageTransition>
  );
}
