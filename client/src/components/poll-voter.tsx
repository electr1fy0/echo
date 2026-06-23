import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useVotePoll } from "@/hooks/use-questions";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

interface PollVoterProps {
  questionId: string;
  pollUid: string;
  pollQuestion: string;
  pollOptions: string[];
  pollVotes: { optionIndex: number; count: number }[];
  userPollVote: number | null;
  isPollClosed: boolean;
}

export function PollVoter({
  questionId,
  pollQuestion,
  pollOptions,
  pollVotes,
  userPollVote,
  isPollClosed,
}: PollVoterProps) {
  const { data: user } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { mutate: vote, isPending } = useVotePoll();

  const totalVotes = pollVotes.reduce((sum, v) => sum + v.count, 0);

  const handleVote = (optionIndex: number) => {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    if (isPollClosed) return;
    vote({ questionId, optionIndex });
  };

  const getVoteCount = (optionIndex: number) => {
    const found = pollVotes.find((v) => v.optionIndex === optionIndex);
    return found?.count ?? 0;
  };

  return (
    <div className="mt-3 p-3 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl w-full">
      <div className="flex items-center gap-2 mb-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-neutral-400 shrink-0">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {pollQuestion}
        </span>
      </div>
      <div className="space-y-1.5">
        {pollOptions.map((option, i) => {
          const count = getVoteCount(i);
          const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          const isUserVote = userPollVote === i;
          const hasVoted = userPollVote !== null;

          return (
            <button
              key={i}
              type="button"
              disabled={isPending || isPollClosed}
              onClick={() => handleVote(i)}
              className={cn(
                "relative w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all cursor-pointer overflow-hidden",
                isUserVote
                  ? "bg-neutral-900/5 dark:bg-neutral-100/5 border border-neutral-900/20 dark:border-neutral-100/20"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50 border border-transparent",
              )}
            >
              <span
                className={cn(
                  "absolute inset-0 transition-all duration-300 rounded-lg",
                  isUserVote
                    ? "bg-neutral-900/10 dark:bg-neutral-100/10"
                    : "bg-neutral-900/5 dark:bg-neutral-100/5",
                )}
                style={{
                  width: hasVoted ? `${pct}%` : "0%",
                }}
              />
              <span className="relative z-10 flex items-center gap-2 w-full">
                <span className="size-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{
                  borderColor: isUserVote ? "currentColor" : undefined,
                }}>
                  {isUserVote && (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 text-neutral-800 dark:text-neutral-200" />
                  )}
                </span>
                <span className="flex-1 font-medium text-neutral-700 dark:text-neutral-300">
                  {option}
                </span>
                {hasVoted && (
                  <span className="font-semibold text-neutral-500 text-[10px] shrink-0">
                    {count} ({Math.round(pct)}%)
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50">
        <span className="text-[10px] text-neutral-400">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </span>
        {isPollClosed && (
          <span className="text-[10px] text-neutral-400 font-medium">Closed</span>
        )}
      </div>
    </div>
  );
}
