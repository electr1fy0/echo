import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon } from "@hugeicons/core-free-icons";
import type { UpvoteState } from "@/types";

type UpvoteButtonProps = UpvoteState & {
  onToggle: () => void;
  className?: string;
  count: number;
  isUpvoted: boolean;
};

export function UpvoteButton({
  count,
  isUpvoted,
  onToggle,
  className,
}: UpvoteButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "gap-1 px-2 h-7 text-neutral-500 hover:bg-transparent hover:text-neutral-900 dark:hover:text-neutral-100",
        isUpvoted &&
          "text-blue-500 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400",
        className,
      )}
    >
      <HugeiconsIcon
        icon={ArrowUp01Icon}
        className={cn("size-4", isUpvoted && "fill-current")}
      />
      <span className="text-xs font-medium">{count}</span>
    </Button>
  );
}
