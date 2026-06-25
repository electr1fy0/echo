import { useState } from "react";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UpvoteButton } from "../upvote-button";
import type { AnswerItem } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  Delete02Icon,
  PencilEdit02Icon,
  Copy01Icon,
  Alert01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
} from "@hugeicons/core-free-icons";
import { useReplyUpdateVote } from "@/hooks/use-upvote";
import { useAcceptReply, useUpdateReply } from "@/hooks/use-replies";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserPreviewCard } from "@/components/ui/user-preview-card";
import { formatDistanceToNowStrict } from "date-fns";
import { handleApiError } from "@/lib/api-error";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { PostContent } from "@/components/post-content";

type ReplyItemProps = {
  answerItem: AnswerItem;
  onDelete: () => void;
  canAccept?: boolean;
  isOp?: boolean;
  onReply?: () => void;
};

export function ReplyItem({
  answerItem,
  onDelete,
  canAccept,
  isOp,
  onReply,
}: ReplyItemProps) {
  const { mutate: updateUpvote, isPending } = useReplyUpdateVote();
  const { mutate: updateReply, isPending: isUpdatePending } = useUpdateReply();
  const { mutate: toggleAccept, isPending: isAcceptPending } = useAcceptReply();
  const { data: user } = useAuth();
  const { open: openAuthModal } = useAuthModal();

  const reply = answerItem.answer;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  function handleSave() {
    if (!editedContent.trim()) return;
    updateReply(
      { qid: reply.questionUid, rid: reply.uid, content: editedContent },
      {
        onSuccess: () => setIsEditing(false),
        onError: (err) => {
          handleApiError(err, "Failed to update reply");
        },
      },
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-3 border-b border-neutral-100 dark:border-neutral-800 py-2 group",
          reply.isAccepted && "",
        )}
      >
        <div className="pt-0.5">
          <UpvoteButton
            count={reply.upvotes}
            isUpvoted={reply.isUpvoted}
            isPending={isPending}
            onToggle={() => {
              if (!user) {
                openAuthModal("signin");
              } else {
                updateUpvote({ qid: reply.questionUid, rid: reply.uid });
              }
            }}
            className="h-3 py-0 px-0 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
          />
        </div>
        {reply.isAnonymous ? (
          <div className="shrink-0">
            <UserAvatar
              src={undefined}
              name="Anonymous"
              className="size-5"
            />
          </div>
        ) : answerItem.author ? (
          <UserPreviewCard user={answerItem.author}>
            <Link
              to={reply.authorUsername ? `/u/${reply.authorUsername}` : "#"}
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <UserAvatar
                src={answerItem.author?.avatar}
                name={reply.authorUsername || "Anonymous"}
                className="size-5"
              />
            </Link>
          </UserPreviewCard>
        ) : (
          <Link
            to={reply.authorUsername ? `/u/${reply.authorUsername}` : "#"}
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <UserAvatar
              src={undefined}
              name={reply.authorUsername || "Anonymous"}
              className="size-5"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs flex flex-col gap-1 text-neutral-500 dark:text-neutral-400 leading-none mt-1 mb-0 pb-0">
            <span className="flex items-center gap-2 w-full">
              {reply.isAnonymous ? (
                <span>Anonymous</span>
              ) : (
                <span>{reply.authorUsername || "Anonymous"}</span>
              )}
              {isOp && (
                <span className="text-[10px] uppercase tracking-wide bg-[var(--brand-15)] text-[var(--brand)] px-1.5 py-0.5 rounded font-semibold">
                  OP
                </span>
              )}
              <span className="text-neutral-400 dark:text-neutral-500">
                {reply.timeCreated &&
                  formatDistanceToNowStrict(new Date(reply.timeCreated), {
                    addSuffix: true,
                  })}
              </span>
              {reply.isAccepted && (
                <span className="text-[10px] uppercase tracking-wide bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                  Accepted
                </span>
              )}
              <span className="flex-1" />
              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="outline-none">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="More options"
                    >
                      <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(reply.content);
                        toastManager.add({ title: "Copied to clipboard", type: "success" });
                      }}
                    >
                      <HugeiconsIcon icon={Copy01Icon} className="mr-2 size-4" />
                      Copy Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => alert("Reported content")}>
                      <HugeiconsIcon icon={Alert01Icon} className="mr-2 size-4" />
                      Report
                    </DropdownMenuItem>
                    {user?.username === reply.authorUsername && (
                      <>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <HugeiconsIcon
                            icon={PencilEdit02Icon}
                            className="mr-2 size-4"
                          />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setShowDeleteAlert(true)}
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            className="mr-2 size-4"
                          />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                    {canAccept && (
                      <DropdownMenuItem
                        onClick={() =>
                          toggleAccept({
                            qid: reply.questionUid,
                            rid: reply.uid,
                            accept: !reply.isAccepted,
                          })
                        }
                        disabled={isAcceptPending}
                      >
                        <HugeiconsIcon
                          icon={
                            reply.isAccepted
                              ? CancelCircleIcon
                              : CheckmarkCircle02Icon
                          }
                          className="mr-2 size-4"
                        />
                        {reply.isAccepted ? "Unaccept answer" : "Accept answer"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </span>
            {isEditing ? (
              <div
                className="mt-2 relative flex items-end rounded-xl border border-input bg-background p-1.5"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
              >
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  unstyled
                  className="min-h-10 pr-24"
                  style={{ resize: "none" }}
                />
                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(reply.content);
                    }}
                    disabled={isUpdatePending}
                    className="h-7 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="xs"
                    onClick={handleSave}
                    disabled={isUpdatePending}
                    className="h-7 text-xs cursor-pointer"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <PostContent
                  content={reply.content}
                  className="block text-sm text-neutral-700 dark:text-neutral-300"
                />
                {onReply && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={onReply}
                      className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogPopup portalProps={{}}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reply</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reply? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>
              Cancel
            </AlertDialogClose>
            <AlertDialogClose
              render={<Button variant="destructive" />}
              onClick={onDelete}
            >
              Delete
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
