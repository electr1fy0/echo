import { useState, useRef, useEffect } from "react";
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
import { toastManager } from "@/components/ui/toast";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Edit01Icon, Delete01Icon, ImageAdd02Icon } from "@hugeicons/core-free-icons";
import { isToday, isYesterday, format } from "date-fns";

import { uploadImagePresigned } from "@/api/upload";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";

function ActionsPopover({ msgUid, onEdit, onDelete }: {
  msgUid: string;
  onEdit: (uid: string) => void;
  onDelete: (uid: string) => void;
}) {
  return (
    <span className="flex gap-1">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => { e.stopPropagation(); onEdit(msgUid); }}
        aria-label="Edit message"
        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
      >
        <HugeiconsIcon icon={Edit01Icon} className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => { e.stopPropagation(); onDelete(msgUid); }}
        aria-label="Delete message"
        className="text-neutral-400 hover:text-destructive"
      >
        <HugeiconsIcon icon={Delete01Icon} className="size-3" />
      </Button>
    </span>
  );
}

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|avif|bmp)(\?.*)?$/i;

function parseMsgContent(content: string): Array<{ type: "text"; text: string } | { type: "image"; url: string }> {
  const segments: Array<{ type: "text"; text: string } | { type: "image"; url: string }> = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (/^https?:\/\//.test(trimmed) && IMAGE_EXT_RE.test(trimmed)) {
      segments.push({ type: "image", url: trimmed });
    } else if (trimmed) {
      segments.push({ type: "text", text: trimmed });
    }
  }
  return segments;
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function formatMessageTime(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo`;
  return `${Math.floor(diffMonth / 12)}y`;
}

function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
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
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const conversation = conversations?.find((c) => c.uid === conversationId);
  const otherUser = conversation?.otherUsername;
  const lastMarkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId || !messages?.length) return;
    const otherMsgs = messages.filter((m) => m.sender !== user?.username);
    if (!otherMsgs.length) return;
    const latestOther = otherMsgs[otherMsgs.length - 1];
    if (latestOther.uid !== lastMarkedRef.current) {
      lastMarkedRef.current = latestOther.uid;
      markRead(conversationId);
    }
  }, [messages, conversationId, markRead, user?.username]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const handleAttachImage = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImage(true);
    try {
      const url = await uploadImagePresigned(files[0]);
      setPendingImages((prev) => [...prev, url]);
    } catch {
      toastManager.add({ title: "Failed to upload image", type: "error" });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if ((!input.trim() && pendingImages.length === 0) || isPending) return;
    const content = pendingImages.length > 0
      ? (input.trim() ? input.trim() + "\n" : "") + pendingImages.join("\n")
      : input.trim();
    send(content, {
      onSuccess: () => { setInput(""); setPendingImages([]); },
      onError: (err) => handleApiError(err, "Failed to send message"),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startEdit = (uid: string) => {
    const msg = messages?.find((m) => m.uid === uid);
    if (msg) { setEditInput(msg.content); setEditingId(uid); }
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
    <MessageScrollerProvider autoScroll>
      <PageTransition className="max-w-[40rem] w-full md:mt-16 mt-6 px-4 pb-4 flex flex-col md:h-[calc(100vh-4rem)] h-[calc(100dvh-7.5rem)]">
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

        <div className="flex items-center gap-3 mb-2 shrink-0">
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

        <MessageScroller className="flex-1" data-conversation>
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-1.5 py-3">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                      <Skeleton className={`h-10 w-3/4 rounded-2xl ${i % 2 === 0 ? "rounded-bl-sm" : "rounded-br-sm"}`} />
                    </div>
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                (() => {
                  const groups: Array<{ dateKey: string; dateLabel: string; msgs: typeof messages }> = [];
                  for (const msg of messages) {
                    const d = new Date(msg.timeCreated);
                    const key = toDateKey(d);
                    const last = groups[groups.length - 1];
                    if (last && last.dateKey === key) {
                      last.msgs.push(msg);
                    } else {
                      groups.push({ dateKey: key, dateLabel: getDateLabel(d), msgs: [msg] });
                    }
                  }

                  return groups.flatMap((group) => [
                    <Marker key={group.dateKey} variant="separator">
                      <MarkerContent className="text-[11px] uppercase tracking-wider font-medium">
                        {group.dateLabel}
                      </MarkerContent>
                    </Marker>,
                    ...group.msgs.map((msg) => {
                      const isMine = msg.sender === user?.username;

                      if (editingId === msg.uid) {
                        return (
                          <MessageScrollerItem key={msg.uid} messageId={msg.uid}>
                            <Message align="end">
                              <MessageContent>
                                <Input
                                  ref={editInputRef}
                                  value={editInput}
                                  onChange={(e) => setEditInput(e.target.value)}
                                  onKeyDown={handleEditKeyDown}
                                  className="text-sm"
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-7 text-xs cursor-pointer">
                                    Cancel
                                  </Button>
                                  <Button variant="default" size="sm" onClick={saveEdit} disabled={isEditing || !editInput.trim()} className="h-7 text-xs cursor-pointer">
                                    Save
                                  </Button>
                                </div>
                              </MessageContent>
                            </Message>
                          </MessageScrollerItem>
                        );
                      }

                      const parsed = parseMsgContent(msg.content);
                      const textParts = parsed.filter((s) => s.type === "text") as { type: "text"; text: string }[];
                      const imageParts = parsed.filter((s) => s.type === "image") as { type: "image"; url: string }[];

                      return (
                        <MessageScrollerItem
                          key={msg.uid}
                          messageId={msg.uid}
                          scrollAnchor={isMine}
                        >
                          <Message align={isMine ? "end" : "start"}>
                            <MessageContent>
                              {textParts.length > 0 && (
                                <Bubble variant={isMine ? "default" : "secondary"}>
                                  <BubbleContent>{textParts.map((s) => s.text).join("\n")}</BubbleContent>
                                </Bubble>
                              )}
                              {imageParts.length > 0 && (
                                <div className={"flex gap-2 overflow-x-auto scrollbar-none " + (textParts.length > 0 ? "-mt-1" : "") + (isMine ? " self-end" : " self-start")}>
                                  {imageParts.map((img, i) => (
                                    <img
                                      key={i}
                                      src={img.url}
                                      alt=""
                                      className="h-48 w-auto min-w-48 max-w-64 rounded-xl object-cover border border-neutral-200/50 dark:border-neutral-700/50 shrink-0"
                                    />
                                  ))}
                                </div>
                              )}
                              <MessageFooter>
                                {isMine && (
                                  <span className="flex md:opacity-0 md:group-hover/message:opacity-100 md:transition-opacity mr-2">
                                    <ActionsPopover
                                      msgUid={msg.uid}
                                      onEdit={startEdit}
                                      onDelete={setDeleteTarget}
                                    />
                                  </span>
                                )}
                                <span className="ml-auto">
                                  {formatMessageTime(new Date(msg.timeCreated))}
                                </span>
                              </MessageFooter>
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                      );
                    }),
                  ]);
                })()
              ) : (
                <div className="flex flex-1 items-center justify-center min-h-48">
                  <EmptyState title="No messages yet" description="Say hello!" />
                </div>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>

        <div className="shrink-0 space-y-2">
          {pendingImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {pendingImages.map((url, i) => (
                <div key={url} className="relative shrink-0">
                  <img
                    src={url}
                    alt=""
                    className="size-12 rounded-xl object-cover border border-neutral-200/50 dark:border-neutral-700/50"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 size-4 rounded-full bg-neutral-900/80 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-sm border border-white dark:border-neutral-800"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="size-2.5" />
                  </button>
                </div>
              ))}
              {uploadingImage && (
                <div className="size-12 shrink-0 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
                  <span className="inline-block size-4 rounded-full border-2 border-neutral-300 border-t-[var(--brand)] animate-spin" />
                </div>
              )}
            </div>
          )}
          <div className="relative flex items-end rounded-xl border border-input bg-background p-1.5">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadingImage}
              onChange={(e) => handleAttachImage(e.target.files)}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              className="shrink-0 text-neutral-400"
              aria-label="Attach image"
            >
              <HugeiconsIcon icon={ImageAdd02Icon} className="size-4" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-10 flex-1"
              rows={1}
              unstyled
              style={{ resize: "none" }}
            />
            <Button
              variant="default"
              onClick={handleSend}
              disabled={isPending || (!input.trim() && pendingImages.length === 0)}
              className="size-9 p-0 rounded-lg cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4 -rotate-90">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </Button>
          </div>
        </div>
      </PageTransition>
    </MessageScrollerProvider>
  );
}
