import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UpvoteButton } from "../upvote-button";
import { useUpvote } from "@/hooks/use-upvote";
import type { Reply } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  Delete02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";

type ReplyItemProps = {
  reply: Reply;
  onDelete: () => void;
};

export function ReplyItem({ reply, onDelete }: ReplyItemProps) {
  const upvote = useUpvote({ initialCount: reply.upvotes ?? 0 });

  return (
    <div className="flex pr-2.5 items-center gap-3 border-b  text-neutral-600 dark:text-neutral-400 py-2.5 text-sm border-neutral-200 dark:border-neutral-700 group">
      <UpvoteButton
        count={upvote.count}
        isUpvoted={upvote.isUpvoted}
        onToggle={upvote.toggle}
        className="h-3 py-2 text-xs  text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
      />
      <span className="flex-1">{reply.content}</span>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            variant="ghost"
            size="icon"
            aria-label="More options"
            className="size-4 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 transition-opacity"
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
    </div>
  );
}
