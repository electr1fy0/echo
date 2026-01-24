import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  ArrowLeft02Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import {
  useJoinChamber,
  useLeaveChamber,
  useListChambers,
} from "@/hooks/use-chamber";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn, getInitials } from "@/lib/utils";
import { useDeleteQuestion, useQuestionsQuery } from "@/hooks/use-questions";
function formatMemberCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
export function ChamberPage() {
  const { chamberId } = useParams<{ chamberId: string }>();
  const navigate = useNavigate();
  const { data: chambers = [], isLoading: isChamberLoading } =
    useListChambers();
  const chamber = chambers.find((c) => c.uid === chamberId);
  const { mutate: deleteQn } = useDeleteQuestion();
  const { data: questions = [], isLoading } = useQuestionsQuery(
    "time_created",
    undefined,
    chamberId,
  );
  const joinMutation = useJoinChamber();
  const leaveMutation = useLeaveChamber();
  const isPending = joinMutation.isPending || leaveMutation.isPending;

  if (isChamberLoading) {
    return (
      <div className="max-w-[40rem] w-full md:mt-24 mt-16 px-4 space-y-8">
        <div className="flex items-start gap-4">
          <Skeleton className="size-16 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full max-w-[200px]" />
            <div className="flex gap-4 mt-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
        <QuestionListSkeleton count={3} />
      </div>
    );
  }

  if (!chamber) {
    return (
      <div className="max-w-xl w-full mt-40 px-4">
        <p className="text-neutral-500">Chamber not found</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <HugeiconsIcon icon={ArrowLeft02Icon} className="mr-2 size-4" />
          Go back
        </Button>
      </div>
    );
  }
  const colorClass =
    CHAMBER_COLORS[(chamber.colorIndex ?? 0) % CHAMBER_COLORS.length];
  const handleToggleJoin = () => {
    if (!chamber?.uid) return;
    if (chamber.isJoined) {
      leaveMutation.mutate(chamber.uid);
    } else {
      joinMutation.mutate(chamber.uid);
    }
  };
  return (
    <div className="max-w-[40rem] w-full md:mt-24 mt-16 mb-40 relative px-4 pb-20 md:pb-0">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-6 transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
        Back
      </button>
      <div className="flex items-start gap-4 mb-8">
        <div
          className={cn(
            "size-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0",
            colorClass,
          )}
        >
          {getInitials(chamber.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {chamber.name}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{chamber.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={UserMultiple02Icon} className="size-3.5" />
              {formatMemberCount(chamber.memberCount || 0)} members
            </span>
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
              Created{" "}
              {chamber.timeCreated
                ? new Date(chamber.timeCreated).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
                : "Jan 2024"}
            </span>
          </div>
        </div>
        <Button
          variant={chamber.isJoined ? "outline" : "default"}
          className="rounded-full shrink-0"
          disabled={isPending}
          onClick={handleToggleJoin}
        >
          {chamber.isJoined ? "Joined" : "Join"}
        </Button>
      </div>
      <div className="space-y-4">
        <h2 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
          Questions ({questions.length})
        </h2>
        {isLoading ? (
          <QuestionListSkeleton count={3} />
        ) : questions.length > 0 ? (
          <QuestionList questions={questions} onDelete={(id) => deleteQn(id)} />
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">No questions yet in this chamber.</p>
            <p className="text-xs mt-1">Be the first to ask!</p>
          </div>
        )}
      </div>
    </div>
  );
}
