import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/questions/question-list";
import { Search01Icon, ArrowRight01Icon, Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  useDeleteQuestion,
  useInfiniteQuestionsQuery,
} from "@/hooks/use-questions";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import { ChamberListSkeleton } from "@/components/ui/skeletons";
import { CreateChamberButton } from "@/components/chambers/chamber-list";
import { CreateChamberDialog } from "@/components/chambers/create-chamber-dialog";
import {
  useListChambers,
  useJoinChamber,
  useLeaveChamber,
} from "@/hooks/use-chamber";
import { useGlobalSearch } from "@/hooks/use-search";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import type { AnswerItem, Chamber } from "@/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useNavigate } from "react-router";
import { PageTransition } from "@/components/page-transition";
import { formatDistanceToNowStrict } from "date-fns";
import { MentionText } from "@/components/mentions/mention-text";
import { cn, getInitials } from "@/lib/utils";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { EmptyState } from "@/components/ui/dashed-empty-state";

function ReplyResult({ item }: { item: AnswerItem }) {
  return (
    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
      <div className="flex items-start gap-3">
        <UserAvatar
          src={item.author.avatar}
          name={item.author.username}
          className="size-8"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {item.author.username}
            </span>
            <span className="text-xs text-neutral-500">
              {item.answer.timeCreated
                ? formatDistanceToNowStrict(new Date(item.answer.timeCreated), {
                    addSuffix: true,
                  })
                : ""}
            </span>
          </div>
          <MentionText
            content={item.answer.content}
            className="block text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2"
          />
          <p className="text-xs text-neutral-400 mt-2">Replied to a question</p>
        </div>
      </div>
    </div>
  );
}

function DirectoryChamberCard({
  chamber,
  onJoinClick,
}: {
  chamber: Chamber;
  onJoinClick: (chamber: Chamber) => void;
}) {
  const navigate = useNavigate();
  const colorClass =
    CHAMBER_COLORS[(chamber.colorIndex || 0) % CHAMBER_COLORS.length];
  return (
    <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1D1D1D] rounded-xl flex items-center justify-between gap-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-950">
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/chamber/${chamber.uid}`)}
      >
        <div
          className={cn(
            "size-9 rounded-lg flex items-center justify-center text-white text-xs shrink-0 select-none",
            colorClass,
          )}
        >
          {getInitials(chamber.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className=" text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {chamber.name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
            <span>{chamber.memberCount || 0} members</span>
          </div>
        </div>
      </div>
      <Button
        variant={chamber.isJoined ? "outline" : "default"}
        size="xs"
        onClick={() => onJoinClick(chamber)}
      >
        {chamber.isJoined ? "Joined" : "Join"}
      </Button>
    </div>
  );
}

export default function Explore() {
  const { data: user } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const [query, setQuery] = useState("");
  const [createChamberOpen, setCreateChamberOpen] = useState(false);
  const navigate = useNavigate();

  const { data: searchResults, isLoading: isSearching } =
    useGlobalSearch(query);

  const {
    data: trendingData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isTrendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useInfiniteQuestionsQuery("hot");
  const trendingQuestions = trendingData ? trendingData.pages.flat() : [];

  const { mutate: deleteQuestion } = useDeleteQuestion();
  const { data: chambers = [], isLoading: isChambersLoading } =
    useListChambers();
  const { mutate: joinChamber } = useJoinChamber();
  const { mutate: leaveChamber } = useLeaveChamber();

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
        { threshold: 0, rootMargin: "200px" },
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  const handleJoinLeave = (chamber: Chamber) => {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    if (chamber.uid) {
      if (chamber.isJoined) {
        leaveChamber(chamber.uid);
      } else {
        joinChamber(chamber.uid);
      }
    }
  };

  const isSearchMode = query.length > 0;
  const isLoading = isSearchMode ? isSearching : isTrendingLoading;

  const {
    users,
    chambers: searchChambers,
    questions: searchQuestions,
    replies,
  } = searchResults;

  const hasSearchResults =
    users.length > 0 ||
    searchChambers.length > 0 ||
    searchQuestions.length > 0 ||
    replies.length > 0;

  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 space-y-4 pb-36 md:pb-16 relative px-4">
      <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0 text-balance">
        Explore
      </h1>
      <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance">
        Discover chambers, search topics, or find people.
      </h2>
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500 pointer-events-none"
        />
        <Input
          placeholder="Search for chambers, questions, or users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-full border-neutral-200 dark:border-neutral-800 bg-[#F5F5F5] dark:bg-neutral-800/50"
          style={{ paddingLeft: "2.5rem", paddingRight: "2rem" }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors text-xs cursor-pointer border-none bg-transparent flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>

      {isSearchMode ? (
        <div className="space-y-8">
          {isLoading ? (
            <QuestionListSkeleton />
          ) : (
            <>
              {users.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
                    Users
                  </h3>
                  <div className="flex flex-col gap-2">
                    {users.map((user) => (
                      <div
                        key={user.username}
                        onClick={() => navigate(`/u/${user.username}`)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800"
                      >
                        <UserAvatar
                          src={user.avatar}
                          name={user.username}
                          className="size-10"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                            {user.username}
                          </h4>
                          {user.bio && (
                            <p className="text-xs text-neutral-500 truncate">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchChambers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
                    Chambers
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {searchChambers.map((chamber) => (
                      <DirectoryChamberCard
                        key={chamber.uid}
                        chamber={chamber}
                        onJoinClick={handleJoinLeave}
                      />
                    ))}
                  </div>
                </div>
              )}
              {searchQuestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
                    Posts
                  </h3>
                  <div className="border border-neutral-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden">
                    <QuestionList
                      questions={searchQuestions}
                      onDelete={deleteQuestion}
                      showChamberName
                    />
                  </div>
                </div>
              )}
              {replies.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
                    Replies
                  </h3>
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
                    {replies.map((reply) => (
                      <ReplyResult key={reply.answer.uid} item={reply} />
                    ))}
                  </div>
                </div>
              )}
              {!hasSearchResults && (
                <EmptyState title={`No results found for "${query}"`} />
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className=" text-neutral-900 dark:text-neutral-100 text-sm">
                Recommended Chambers
              </h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  if (!user) {
                    openAuthModal("signin");
                  } else {
                    navigate("/chambers");
                  }
                }}
              >
                Browse all
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
              </Button>
            </div>
            {isChambersLoading ? (
              <ChamberListSkeleton count={3} />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {chambers.slice(0, 3).map((chamber) => (
                  <DirectoryChamberCard
                    key={chamber.uid}
                    chamber={chamber}
                    onJoinClick={handleJoinLeave}
                  />
                ))}
              </div>
            )}
            <CreateChamberButton
              onClick={() => {
                if (!user) {
                  openAuthModal("signin");
                } else {
                  setCreateChamberOpen(true);
                }
              }}
            />
          </div>
          <div className="space-y-4">
            <h3 className=" text-neutral-900 dark:text-neutral-100 text-sm px-1">
              Hot Conversations
            </h3>
            {isTrendingLoading ? (
              <QuestionListSkeleton />
            ) : trendingError ? (
              <EmptyState
                icon={<HugeiconsIcon icon={Alert02Icon} className="size-6" />}
                title="Failed to load questions"
                action={
                  <Button variant="outline" size="sm" onClick={() => refetchTrending()}>
                    Try again
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <div className="border border-neutral-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden">
                  <QuestionList
                    questions={trendingQuestions}
                    onDelete={(id) => deleteQuestion(id)}
                    showChamberName
                  />
                </div>
                {hasNextPage && (
                  <div
                    ref={loadMoreCallbackRef}
                    className="flex justify-center pt-4"
                  >
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="w-full"
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
            )}
          </div>
        </div>
      )}
      <CreateChamberDialog
        open={createChamberOpen}
        onOpenChange={setCreateChamberOpen}
      />
    </PageTransition>
  );
}
