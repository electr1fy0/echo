import { useState } from "react";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeTime } from "@/lib/format-time";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { MentionText } from "@/components/mentions/mention-text";

type ReplyItemProps = {
  answerItem: AnswerItem;
  onDelete: () => void;
  canAccept?: boolean;
};

export function ReplyItem({ answerItem, onDelete, canAccept }: ReplyItemProps) {
  const { mutate: updateUpvote, isPending } = useReplyUpdateVote();
  const { mutate: updateReply, isPending: isUpdatePending } = useUpdateReply();
  const { mutate: toggleAccept, isPending: isAcceptPending } = useAcceptReply();
  const { data: user } = useAuth();

  const reply = answerItem.answer;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content);

  function handleSave() {
    if (!editedContent.trim()) return;
    updateReply(
      { qid: reply.questionUid, rid: reply.uid, content: editedContent },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  }

  return (
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
            updateUpvote({ qid: reply.questionUid, rid: reply.uid });
          }}
          className="h-3 py-0 px-0 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
        />
      </div>
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
      <div className="flex-1 min-w-0">
        <p className="text-xs flex flex-col gap-1 text-neutral-500 dark:text-neutral-400 leading-none mt-1 mb-0 pb-0">
          <span className="flex items-center gap-2">
            <span>{reply.authorUsername || "Anonymous"}</span>
            <span className="text-neutral-400 dark:text-neutral-500">
              {reply.timeCreated &&
                formatRelativeTime(new Date(reply.timeCreated))}
            </span>
            {reply.isAccepted && (
              <span className="text-[10px] uppercase tracking-wide bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                Accepted
              </span>
            )}
          </span>
          {isEditing ? (
            <div
              className="mt-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
            >
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[60px] bg-background mb-2 text-sm"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(reply.content);
                  }}
                  disabled={isUpdatePending}
                  className="h-7 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdatePending}
                  className="h-7 px-3 text-xs"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <MentionText
              content={reply.content}
              className="block text-sm text-neutral-700 dark:text-neutral-300"
            />
          )}
        </p>
      </div>
      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Button
              variant="ghost"
              size="icon"
              aria-label="More options"
              className="size-6   text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 transition-opacity shrink-0"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(reply.content);
                toast.success("Copied to clipboard");
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
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <HugeiconsIcon icon={Delete02Icon} className="mr-2 size-4" />
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
                    reply.isAccepted ? CancelCircleIcon : CheckmarkCircle02Icon
                  }
                  className="mr-2 size-4"
                />
                {reply.isAccepted ? "Unaccept answer" : "Accept answer"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
