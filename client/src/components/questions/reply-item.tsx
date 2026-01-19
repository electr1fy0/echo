import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UpvoteButton } from "../upvote-button";
import type { AnswerItem } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  Delete02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { useReplyUpdateVote } from "@/hooks/use-upvote";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeTime } from "@/lib/format-time";
type ReplyItemProps = {
  answerItem: AnswerItem;
  onDelete: () => void;
};
export function ReplyItem({ answerItem, onDelete }: ReplyItemProps) {
  const { mutate: updateUpvote, isPending } = useReplyUpdateVote();
  const { data: user } = useAuth();
  const reply = answerItem.answer;
  return (
    <div className="flex items-start gap-3 border-b border-neutral-100 dark:border-neutral-800 py-2 group">
      <div className="pt-0.5">
        <UpvoteButton
          count={reply.upvotes}
          isUpvoted={reply.isUpvoted}
          disabled={isPending}
          onToggle={() => {
            updateUpvote({ qid: reply.questionUid, rid: reply.uid });
          }}
          className="h-3 py-0 px-0 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
        />
      </div>
      <div className="shrink-0">
        <UserAvatar
          src={answerItem.author?.avatar}
          name={reply.authorUsername || "Anonymous"}
          className="size-5"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs flex flex-col gap-1 text-neutral-500 dark:text-neutral-400 leading-none mt-1 mb-0 pb-0">
          <span className="flex items-center gap-2">
            <span>{reply.authorUsername || "Anonymous"}</span>
            <span className="text-neutral-400 dark:text-neutral-500">
              {reply.timeCreated && formatRelativeTime(new Date(reply.timeCreated))}
            </span>
          </span>
          <span className="block text-sm text-neutral-700 dark:text-neutral-300 ">
            {reply.content}
          </span>
        </p>
      </div>
      {user?.username === reply.authorUsername && (
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Button
              variant="ghost"
              size="icon"
              aria-label="More options"
              className="size-6 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 transition-opacity shrink-0"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <HugeiconsIcon icon={PencilEdit02Icon} className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <HugeiconsIcon icon={Delete02Icon} className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
