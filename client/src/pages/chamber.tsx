import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  ArrowLeft02Icon,
  Calendar03Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { useNavigate, useParams } from "react-router";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import {
  useJoinChamber,
  useLeaveChamber,
  useListChambers,
} from "@/hooks/use-chamber";
import { useAuth } from "@/hooks/use-auth";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn, getInitials } from "@/lib/utils";
import { useDeleteQuestion, useInfiniteQuestionsQuery } from "@/hooks/use-questions";
import { PageTransition } from "@/components/page-transition";
import { EditChamberDialog } from "@/components/chambers/edit-chamber-dialog";

function formatMemberCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
export default function ChamberPage() {
  const { chamberId } = useParams<{ chamberId: string }>();
  const navigate = useNavigate();
  const { data: chambersData, isLoading: isChamberLoading } = useListChambers();
  const { data: user } = useAuth();
  const chambers = chambersData || [];
  const chamber = chambers.find((c) => c.uid === chamberId);
  const { mutate: deleteQn } = useDeleteQuestion();
  const {
    data: questionsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuestionsQuery(
    "time_created",
    undefined,
    chamberId,
  );
  const questions = questionsData ? questionsData.pages.flat() : [];

  const fetchNextPageRef = useRef(fetchNextPage);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);

  /* eslint-disable react-hooks/refs */
  fetchNextPageRef.current = fetchNextPage;
  hasNextPageRef.current = hasNextPage;
  isFetchingNextPageRef.current = isFetchingNextPage;
  /* eslint-enable react-hooks/refs */

  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (
            entry.isIntersecting &&
            hasNextPageRef.current &&
            !isFetchingNextPageRef.current
          ) {
            fetchNextPageRef.current();
          }
        },
        { threshold: 0, rootMargin: "200px" }
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);
  const joinMutation = useJoinChamber();
  const leaveMutation = useLeaveChamber();
  const isPending = joinMutation.isPending || leaveMutation.isPending;
  const [isEditOpen, setIsEditOpen] = useState(false);

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
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!chamber?.uid) return;
    if (chamber.isJoined) {
      leaveMutation.mutate(chamber.uid);
    } else {
      joinMutation.mutate(chamber.uid);
    }
  };
  const canPin = !!user?.username && user.username === chamber.creatorUsername;
  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 pb-36 md:pb-16 relative px-4">
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
        <div className="flex items-center gap-2 shrink-0">
          {canPin && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setIsEditOpen(true)}
            >
              <HugeiconsIcon icon={PencilEdit02Icon} className="mr-1 size-4" />
              Edit
            </Button>
          )}
          <Button
            variant={chamber.isJoined ? "outline" : "default"}
            className="rounded-full"
            disabled={isPending}
            onClick={handleToggleJoin}
          >
            {chamber.isJoined ? "Joined" : "Join"}
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
          Questions ({questions.length})
        </h2>
        {isLoading ? (
          <QuestionListSkeleton count={3} />
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            <QuestionList
              questions={questions}
              onDelete={(id) => deleteQn(id)}
              canPin={canPin}
            />
            {hasNextPage && (
              <div ref={loadMoreCallbackRef} className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-full w-full py-5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors gap-2 cursor-pointer"
                >
                  {isFetchingNextPage ? (
                    <>
                      <span className="inline-block animate-spin size-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-800 dark:border-t-neutral-200" />
                      Loading more...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">No questions yet in this chamber.</p>
            <p className="text-xs mt-1">Be the first to ask!</p>
          </div>
        )}
      </div>
      {canPin && chamber.uid && (
        <EditChamberDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          chamber={chamber}
        />
      )}
    </PageTransition>
  );
}
