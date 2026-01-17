import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UpvoteButton } from "../upvote-button";
// import { useUpvote } from "@/hooks/use-upvote";
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
  return (
    <div className="flex items-start gap-3 border-b border-neutral-100 dark:border-neutral-800 py-2 group">
      <div className="pt-0.5">
        <UpvoteButton
          count={0}
          isUpvoted={false}
          onToggle={() => {}}
          className="h-3 py-0 px-0 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
        />
      </div>
      <div className="size-5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden shrink-0">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author || reply.uid}`}
          alt=""
          className="size-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs flex flex-col gap-2 text-neutral-500 dark:text-neutral-400 leading-none mt-1 mb-0 pb-0">
          <span className="block"> {reply.author || "Anonymous"} </span>
          <span className="block text-sm text-neutral-700 dark:text-neutral-300 ">
            {reply.content}
          </span>
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger>
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
    </div>
  );
}
