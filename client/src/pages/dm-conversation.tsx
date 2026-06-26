import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useMessages, useSendMessage, useConversations, useMarkConversationRead, useEditMessage, useDeleteMessage } from "@/hooks/use-dms";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/page-transition";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/api-error";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Edit01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";
import { useWebHaptics } from "@/lib/haptic";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";

function MessageBubble({ msg, isMine, active, onToggle, onEdit, onDelete }: {
  msg: { uid: string; sender: string; content: string; timeCreated: string };
  isMine: boolean;
  active: boolean;
  onToggle: (uid: string | null) => void;
  onEdit: (uid: string) => void;
  onDelete: (uid: string) => void;
}) {
  const { trigger } = useWebHaptics();
  const isMobile = useIsMobile();

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!isMine) return;
    e.preventDefault();
    trigger("medium");
    onToggle(msg.uid);
  }, [isMine, msg.uid, trigger, onToggle]);

  return (
      <div className={cn("flex group", isMine ? "justify-end" : "justify-start")}>
      <div className="max-w-[80%] flex flex-col">
        <div
          className={cn(
            "px-3.5 py-2 text-sm leading-relaxed",
            isMine
              ? "bg-[var(--brand)] text-white rounded-2xl rounded-br-sm"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-bl-sm",
          )}
        >
          {msg.content}
        </div>
        <span
          className={cn(
            "text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1.5",
            isMine ? "justify-end mr-1" : "ml-1",
          )}
        >
          {formatDistanceToNowStrict(new Date(msg.timeCreated), { addSuffix: true })}
          {isMine && (
            <>
              {isMobile ? (
                <span
                  onContextMenu={handleContextMenu}
                  onClick={() => onToggle(active ? null : msg.uid)}
                  className="text-[9px] text-neutral-400 dark:text-neutral-500 cursor-pointer select-none active:opacity-60"
                >
                  {active ? "hide" : "···"}
                </span>
              ) : (
                <span className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(msg.uid); }}
                    className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                    aria-label="Edit message"
                  >
                    <HugeiconsIcon icon={Edit01Icon} className="size-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(msg.uid); }}
                    className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                    aria-label="Delete message"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="size-3" />
                  </button>
                </span>
              )}
            </>
          )}
        </span>
        {isMine && isMobile && active && (
          <span className="flex gap-1.5 mt-1 justify-end">
            <button
              onClick={() => onEdit(msg.uid)}
              className="text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
            >
              <HugeiconsIcon icon={Edit01Icon} className="size-3.5 inline mr-0.5" />
              Edit
            </button>
            <button
              onClick={() => onDelete(msg.uid)}
              className="text-[11px] text-red-500 hover:text-red-600 cursor-pointer"
            >
              <HugeiconsIcon icon={Delete01Icon} className="size-3.5 inline mr-0.5" />
              Delete
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

export default function DMConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { data: messages, isLoading } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const { mutate: send, isPending } = useSendMessage(conversationId);
  const { data: user } = useAuth();
  const { mutate: markRead } = useMarkConversationRead();
  const { mutate: editMsg, isPending: isEditing } = useEditMessage(conversationId);
  const { mutate: deleteMsg } = useDeleteMessage(conversationId);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [activeMsgId, setActiveMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const conversation = conversations?.find((c) => c.uid === conversationId);
  const otherUser = conversation?.otherUsername;

  useEffect(() => {
    if (conversationId) markRead(conversationId);
  }, [conversationId, markRead]);

  useEffect(() => {
    if (messages && messages.length > 0 && conversationId) markRead(conversationId);
  }, [messages, conversationId, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const handleSend = () => {
    if (!input.trim() || isPending) return;
    send(input.trim(), { onSuccess: () => setInput(""), onError: (err) => handleApiError(err, "Failed to send message") });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startEdit = (uid: string) => {
    const msg = messages?.find((m) => m.uid === uid);
    if (msg) { setEditInput(msg.content); setEditingId(uid); setActiveMsgId(null); }
  };

  const cancelEdit = () => {
    setEditingId(null); setEditInput("");
  };

  const saveEdit = () => {
    if (!editingId || !editInput.trim() || isEditing) return;
    editMsg({ messageUid: editingId, content: editInput.trim() }, { onSuccess: () => cancelEdit(), onError: (err) => handleApiError(err, "Failed to edit message") });
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
    if (e.key === "Escape") cancelEdit();
  };

  if (!conversationId) return null;

  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-16 mt-6 px-4 pb-4 flex flex-col md:h-[calc(100vh-4rem)] h-[calc(100vh-6rem)]">
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" size="sm" className="cursor-pointer" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="default"
              size="sm"
              onClick={() => { if (deleteTarget) deleteMsg(deleteTarget, { onSuccess: () => setDeleteTarget(null), onError: (err) => handleApiError(err, "Failed to delete message") }); }}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-3 mb-2 -mt-0">
        <button
          onClick={() => navigate("/dm")}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5 text-neutral-500" />
        </button>
        {otherUser && (
          <Link
            to={`/u/${otherUser}`}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <UserAvatar src={conversation?.otherAvatar} name={otherUser} className="size-8" />
            <span className="text-sm text-neutral-900 dark:text-neutral-100">{otherUser}</span>
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-0 scrollbar-none pt-3">
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
              if (editingId === msg.uid) {
                return (
                  <div key={msg.uid} className="flex justify-end">
                    <div className="max-w-[80%] flex flex-col gap-1.5">
                      <Input
                        ref={editInputRef}
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        className="text-sm"
                      />
                      <span className="flex gap-1.5 justify-end">
                        <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-7 text-xs cursor-pointer">
                          Cancel
                        </Button>
                        <Button variant="default" size="sm" onClick={saveEdit} disabled={isEditing || !editInput.trim()} className="h-7 text-xs cursor-pointer">
                          Save
                        </Button>
                      </span>
                    </div>
                  </div>
                );
              }
              return (
                <MessageBubble
                  key={msg.uid}
                  msg={msg}
                  isMine={isMine}
                  active={activeMsgId === msg.uid}
                  onToggle={setActiveMsgId}
                  onEdit={startEdit}
                  onDelete={setDeleteTarget}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <EmptyState title="No messages yet" description="Say hello!" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="relative flex items-end rounded-xl border border-input bg-background p-1.5 shrink-0">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-10 flex-1 pr-14"
          rows={1}
          unstyled
          style={{ resize: "none" }}
        />
        <Button
          variant="default"
          onClick={handleSend}
          disabled={isPending || !input.trim()}
          className="absolute bottom-1.5 size-9 p-0 rounded-lg cursor-pointer right-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4 -rotate-90">
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </Button>
      </div>
    </PageTransition>
  );
}
