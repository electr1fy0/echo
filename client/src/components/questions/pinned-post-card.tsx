import { Link, useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Pin02Icon,
  BubbleChatIcon,
  PinOffIcon,
} from "@hugeicons/core-free-icons";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";
import type { QuestionItem } from "@/types";
import { useUnpinQuestion } from "@/hooks/use-questions";
import { useAuth } from "@/hooks/use-auth";
import { UpvoteButton } from "@/components/upvote-button";
import { useUpdateVote } from "@/hooks/use-upvote";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { MentionText } from "@/components/mentions/mention-text";
import { toast } from "@/lib/toast";
import { useRepliesQuery } from "@/hooks/use-replies";

type PinnedPostCardProps = {
  questionItem: QuestionItem;
  canPin?: boolean;
};

export function PinnedPostCard({ questionItem, canPin }: PinnedPostCardProps) {
  const navigate = useNavigate();
  const question = questionItem?.question;
  const author = questionItem?.author ?? null;
  const questionId = question?.uid;

  const { data: user } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { mutate: handleVote, isPending: isVotePending } = useUpdateVote();
  const { mutate: unpinQuestion, isPending: isUnpinPending } = useUnpinQuestion();
  const { data: replies = [] } = useRepliesQuery(questionId);

  if (!question || !questionId) return null;

  const handleCardClick = () => {
    navigate(`/q/${questionId}`);
  };

  const handleUnpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    unpinQuestion(questionId, {
      onSuccess: () => {
        toast.success("Post unpinned");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to unpin post");
      },
    });
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "flex flex-col justify-between h-[160px] w-[280px] shrink-0 snap-start p-4 rounded-xl border",
        "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900",
        "hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors duration-150 cursor-pointer select-none"
      )}
    >
      {/* Top Section: Author info & Unpin/Pin indicator */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to={question.authorUsername ? `/u/${question.authorUsername}` : "#"}
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <UserAvatar
              src={author?.avatar}
              name={question.authorUsername || "Anonymous"}
              className="size-6"
            />
          </Link>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300 truncate">
              {question.authorUsername || "Anonymous"}
            </span>
            <span className="text-[9px] text-neutral-400 dark:text-neutral-500">
              {question.timeCreated && formatRelativeTime(new Date(question.timeCreated))}
            </span>
          </div>
        </div>

        {/* Pin Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {canPin ? (
            <button
              onClick={handleUnpin}
              disabled={isUnpinPending}
              title="Unpin post"
              className={cn(
                "p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                "transition-colors duration-150 cursor-pointer"
              )}
            >
              <HugeiconsIcon icon={PinOffIcon} className="size-3.5" />
            </button>
          ) : (
            <span className="p-1 rounded-md text-[#ff5a1f] bg-orange-500/10 dark:bg-orange-500/5">
              <HugeiconsIcon icon={Pin02Icon} className="size-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Middle Section: Truncated Content */}
      <div className="flex-1 my-2 overflow-hidden">
        <div className="line-clamp-2 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
          <MentionText content={question.content} />
        </div>
        
        {/* Post Type Specific Tiny Badges */}
        {question.postType === "partner" && (
          <span className="inline-block mt-1 text-[8px] font-bold uppercase tracking-wider text-[#ff5a1f] bg-[#ff5a1f]/5 px-1.5 py-0.5 rounded border border-[#ff5a1f]/10">
            Partner Finder
          </span>
        )}
        {question.postType === "trade" && (
          <span className="inline-block mt-1 text-[8px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
            Marketplace
          </span>
        )}
        {question.postType === "taxi" && (
          <span className="inline-block mt-1 text-[8px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/5 px-1.5 py-0.5 rounded border border-purple-500/10">
            Taxi Sharing
          </span>
        )}
      </div>

      {/* Bottom Section: Upvote, Replies, and extra meta */}
      <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-2">
        <div className="flex items-center gap-2">
          <UpvoteButton
            count={question.upvotes}
            isUpvoted={question.isUpvoted}
            onToggle={() => {
              if (!user) {
                openAuthModal("signin");
              } else {
                handleVote(questionId);
              }
            }}
            isPending={isVotePending}
            className="h-6 px-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          />
          <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500 text-[11px] px-1">
            <HugeiconsIcon icon={BubbleChatIcon} className="size-3.5" />
            <span className="font-medium">{replies.length}</span>
          </div>
        </div>

        {/* Trade Price (if applicable) */}
        {question.postType === "trade" && question.tradePrice && (
          <span className="text-[11px] font-bold text-[#ff5a1f]">
            ₹{(question.tradePrice / 100).toFixed(0)}
          </span>
        )}
        
        {/* Partner Slots (if applicable) */}
        {question.postType === "partner" && question.partnerSlotsNeeded && (
          <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400">
            {question.partnerSlotsNeeded} slots left
          </span>
        )}
        
        {/* Taxi route (if applicable) */}
        {question.postType === "taxi" && (
          <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 truncate max-w-[130px]" title={`${question.taxiDeparture} ➔ ${question.taxiDestination}`}>
            {question.taxiDeparture} ➔ {question.taxiDestination}
          </span>
        )}
      </div>
    </div>
  );
}
