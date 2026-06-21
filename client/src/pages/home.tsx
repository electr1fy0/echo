import { useState, useRef, useCallback } from "react";
import {
  useQuestionDraft,
  useCreateQuestion,
  useDeleteQuestion,
  useInfiniteQuestionsQuery,
} from "@/hooks/use-questions";
import { Link } from "react-router";
import { MentionField } from "@/components/ui/mention-field";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import {
  Add01Icon,
  Time02Icon,
  FireIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { useListChambers } from "@/hooks/use-chamber";
import { ChamberCard } from "@/components/chambers/chamber-list";
import { CHAMBER_COLORS } from "@/components/chambers/consts";

import { PageTransition } from "@/components/page-transition";
import { validateMentions } from "@/lib/mention-validation";
import { toast } from "@/lib/toast";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"recent" | "trending">("recent");
  const [selectedChamber, setSelectedChamber] = useState<string>("");
  const { mutate: submitQuestion, isPending: isCreatePending } =
    useCreateQuestion();
  const [isValidating, setIsValidating] = useState(false);
  const { draft, updateDraft, resetDraft } = useQuestionDraft();
  const { mutate: deleteQuestion } = useDeleteQuestion();
  const { data: chambersData, isLoading } = useListChambers();
  const chambers = chambersData || [];
  const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);
  const {
    data: questionsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isQuestionsLoading,
  } = useInfiniteQuestionsQuery(
    activeTab === "trending" ? "votes" : "time_created",
    "joined",
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
  const selectedChamberData = JOINED_CHAMBERS.find(
    (c) => c.uid === selectedChamber,
  );
  const handleSubmit = async () => {
    if (
      !draft.content.trim() ||
      !selectedChamber ||
      isCreatePending ||
      isValidating
    )
      return;
    setIsValidating(true);
    try {
      const result = await validateMentions(draft.content);
      if (result.missing.length > 0) {
        toast.error(`User not found: ${result.missing.join(", ")}`);
        setIsValidating(false);
        return;
      }
      submitQuestion(
        { ...draft, chamberUid: selectedChamber },
        {
          onSuccess: () => {
            resetDraft();
            setSelectedChamber("");
          },
          onSettled: () => {
            setIsValidating(false);
          },
        },
      );
    } catch {
      toast.error("Failed to validate mentions");
      setIsValidating(false);
    }
  };
  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 space-y-4 pb-36 md:pb-16 relative px-4">
      <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0 text-balance">
        Echo
      </h1>
      <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance">
        An Open QnA platform
      </h2>
      <div className="space-y-3">
        <div
          className="
            border border-dashed
            border-neutral-300 dark:border-neutral-700
            bg-background rounded-2xl
            transition-colors
            focus-within:border-neutral-400
            dark:focus-within:border-neutral-500
            overflow-visible
          "
        >
          <MentionField
            placeholder={
              selectedChamberData
                ? `Ask in ${selectedChamberData.name}...`
                : "Select a chamber to ask a question..."
            }
            ariaLabel="Question content"
            className="resize-none h-20 border-none shadow-none focus-visible:ring-0 bg-transparent px-4 py-3 text-base"
            value={draft.content}
            onValueChange={(value) => updateDraft({ content: value })}
            multiline
          />
          <div className="flex items-center justify-between p-2 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-2 h-8 px-2.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors focus:outline-none">
                {selectedChamberData ? (
                  <>
                    <div
                      className={cn(
                        "size-2 rounded-full",
                        CHAMBER_COLORS[
                          (selectedChamberData.colorIndex || 0) %
                            CHAMBER_COLORS.length
                        ],
                      )}
                    />
                    {selectedChamberData.name}
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      className="size-3.5 text-neutral-500"
                    />
                    Select Chamber
                  </>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {JOINED_CHAMBERS.length > 0 ? (
                  JOINED_CHAMBERS.map((chamber, i) => (
                    <DropdownMenuItem
                      key={chamber.uid || i}
                      onClick={() => setSelectedChamber(chamber.uid!)}
                      className="gap-2"
                    >
                      <div
                        className={cn(
                          "size-3 rounded-full",
                          CHAMBER_COLORS[
                            (chamber.colorIndex || 0) % CHAMBER_COLORS.length
                          ],
                        )}
                      />
                      {chamber.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-neutral-500">
                    No chambers joined
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="font-normal rounded-lg h-8 px-4"
              onClick={handleSubmit}
              disabled={
                !selectedChamber ||
                !draft.content.trim() ||
                isValidating ||
                isCreatePending
              }
            >
              Ask
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                className="ml-1.5 size-3.5"
              />
            </Button>
          </div>
        </div>
      </div>
      <div className="my-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            From your chambers
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("recent")}
              className={cn(
                "h-7 rounded-full text-xs px-3 transition-all gap-1.5",
                activeTab === "recent"
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
              )}
            >
              <HugeiconsIcon
                icon={Time02Icon}
                className="size-3.5"
                strokeWidth={2}
              />
              Recent
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("trending")}
              className={cn(
                "h-7 rounded-full text-xs px-3 transition-all gap-1.5",
                activeTab === "trending"
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
              )}
            >
              <HugeiconsIcon
                icon={FireIcon}
                className="size-3.5"
                strokeWidth={2}
              />
              Trending
            </Button>
          </div>
        </div>
        {JOINED_CHAMBERS.length === 0 && !isLoading ? (
          <div className="space-y-4">
            <div className="text-center py-6">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                You haven't joined any chambers yet.
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Join some chambers to see questions in your feed.
              </p>
            </div>
            {chambers.filter((c) => !c.isJoined).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Suggested Chambers
                </h4>
                <div className="space-y-2">
                  {chambers
                    .filter((c) => !c.isJoined)
                    .slice(0, 4)
                    .map((chamber, i) => (
                      <ChamberCard
                        key={chamber.uid || i}
                        chamber={{
                          ...chamber,
                          colorIndex: chamber.colorIndex ?? i,
                        }}
                      />
                    ))}
                </div>
                <Link
                  to="/chambers"
                  className="block text-center text-sm text-primary hover:underline pt-2"
                >
                  Show All Chambers
                </Link>
              </div>
            )}
          </div>
        ) : isQuestionsLoading ? (
          <QuestionListSkeleton count={3} />
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            <QuestionList
              questions={questions}
              onDelete={(id) => deleteQuestion(id)}
              showChamberName
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
            <p className="text-sm">No questions in your feed.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
