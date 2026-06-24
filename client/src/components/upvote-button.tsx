import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleArrowUp01Icon } from "@hugeicons/core-free-icons";
import type { UpvoteState } from "@/types";
import { useWebHaptics } from "@/lib/haptic";

type UpvoteButtonProps = UpvoteState & {
  onToggle: () => void;
  className?: string;
  count: number;
  isUpvoted: boolean;
  disabled?: boolean;
};

export function UpvoteButton({
  count,
  isUpvoted,
  onToggle,
  className,
  isPending,
}: UpvoteButtonProps & { isPending?: boolean }) {
  const { trigger } = useWebHaptics();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        if (isPending) return;
        trigger("selection");
        onToggle();
      }}
      className={cn(
        "gap-1 px-2 h-7 text-neutral-500 hover:bg-transparent hover:text-neutral-900 dark:hover:text-neutral-100 group/upvote transition-all duration-200 active:scale-95",
        className,
        isUpvoted &&
          "text-[var(--brand)] hover:text-[var(--brand-hover)] dark:text-[var(--brand)] dark:hover:text-[var(--brand)]",
      )}
    >
      <HugeiconsIcon icon={CircleArrowUp01Icon} className="size-4 transition-transform group-hover/upvote:-translate-y-0.5" />
      <span className="text-xs font-medium">{count}</span>
    </Button>
  );
}
