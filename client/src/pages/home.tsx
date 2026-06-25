import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth, useToken } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useDeleteQuestion,
  useInfiniteQuestionsQuery,
} from "@/hooks/use-questions";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import {
  Add01Icon,
  ArrowDown01Icon,
  Delete02Icon,
  FilterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import {
  useListChambers,
} from "@/hooks/use-chamber";
import { ChamberCard } from "@/components/chambers/chamber-list";
import { TextFlip } from "@/components/text-flip";
import { PageTransition } from "@/components/page-transition";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/menu";

const CHANNEL_LABELS: Record<string, string> = {
  discussion: "Discussions",
  marketplace: "Market",
  carpools: "Carpools",
  "study-partners": "Partners",
  "lost-and-found": "Lost & Found",
  resources: "Resources",
};

export interface FeedColumn {
  id: string;
  title: string;
  sortBy: "time_created" | "votes" | "hot";
  postTypeFilter: string;
  chamberSource: "joined" | "global" | string;
  postScope: "all" | "my-posts";
}

interface ColumnFeedProps {
  column: FeedColumn;
  onDeleteColumn: () => void;
  onUpdateColumn: (updated: Partial<FeedColumn>) => void;
  user: any;
  hasToken: boolean;
  chambers: any[];
  JOINED_CHAMBERS: any[];
  deleteQuestion: (id: string) => void;
  canDelete: boolean;
  isMobile?: boolean;
}

function ColumnFeed({
  column,
  onDeleteColumn,
  onUpdateColumn,
  user,
  hasToken,
  chambers,
  JOINED_CHAMBERS,
  deleteQuestion,
  canDelete,
  isMobile = false,
}: ColumnFeedProps) {
  const isSpecificChamber =
    column.chamberSource !== "joined" && column.chamberSource !== "following" && column.chamberSource !== "global";
  const selectedChamberObj = isSpecificChamber
    ? chambers.find((c) => c.uid === column.chamberSource)
    : undefined;

  const {
    data: questionsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isQuestionsLoading,
  } = useInfiniteQuestionsQuery(
    column.sortBy,
    column.chamberSource === "joined" && hasToken ? "joined" : column.chamberSource === "following" && hasToken ? "following" : undefined,
    isSpecificChamber ? column.chamberSource : undefined,
    column.postScope === "my-posts" && user ? user.username : undefined,
    20,
    undefined,
    false,
    undefined,
    undefined,
    column.postTypeFilter === "all" ? undefined : column.postTypeFilter,
  );

  const questions = questionsData ? questionsData.pages.flat() : [];

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (node) {
        const observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          },
          { threshold: 0, rootMargin: "100px" },
        );
        observer.observe(node);
        observerRef.current = observer;
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  const feedContent = (
    <>
      {column.chamberSource === "joined" && JOINED_CHAMBERS.length === 0 ? (
        <div className="space-y-6 px-4 py-4">
          <EmptyState
            title="No joined chambers yet"
            description="Join some chambers to populate your feed, or change this column's source to Global Feed."
          />

          {chambers.filter((c) => !c.isJoined).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide px-1">
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
                className="block text-center text-xs text-neutral-600 dark:text-neutral-400 hover:text-[var(--brand)] transition-colors pt-2"
              >
                Explore all chambers →
              </Link>
            </div>
          )}
        </div>
      ) : isQuestionsLoading ? (
        <QuestionListSkeleton />
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
                className="w-full"
              >
                {isFetchingNextPage ? (
                  <>
                    <span className="inline-block animate-spin size-3 rounded-full border border-neutral-300 dark:border-neutral-600 border-t-neutral-800 dark:border-t-neutral-200" />
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
        <EmptyState
          title="No posts matching filters"
          description="Try selecting different topics or check back later."
        />
      )}
    </>
  );

  return isMobile ? (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-2">
          <div className="flex-1 min-w-0 mr-2">
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer border shrink-0 bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-50 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80"
                    title="Configure feed"
                  >
                    <HugeiconsIcon icon={FilterIcon} className="size-3.5" />
                    <span>
                        {column.chamberSource === "joined"
                          ? "Joined Feed"
                          : column.chamberSource === "following"
                            ? "Following Feed"
                            : column.chamberSource === "global"
                              ? "Global Feed"
                          : selectedChamberObj?.name || "Chamber"}
                      {column.postTypeFilter !== "all" &&
                        ` • ${CHANNEL_LABELS[column.postTypeFilter] || column.postTypeFilter.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`}
                      {` • ${column.sortBy === "time_created" ? "Recent" : column.sortBy === "votes" ? "Top Posts" : "Hot"}`}
                    </span>
                  </button>
                }
              />
              <PopoverPopup className="w-80 p-4 bg-background/95 backdrop-blur-md rounded-2xl shadow-xl space-y-4 text-xs">
                {/* Sort & Scope Row */}
                <div
                  className={cn(
                    "grid gap-3",
                    user ? "grid-cols-2" : "grid-cols-1",
                  )}
                >
                  {/* Sort Segment */}
                  <div className="flex flex-col gap-1.5">
                    <span className=" text-neutral-400 uppercase text-[9px] tracking-wider">
                      Sort by
                    </span>
                    <div className="flex bg-neutral-100/80 dark:bg-neutral-900/60 p-0.5 rounded-lg border border-neutral-200/40 dark:border-neutral-800/40">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateColumn({ sortBy: "time_created" })
                        }
                        className={cn(
                          "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
                          column.sortBy === "time_created"
                            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
                            : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                        )}
                      >
                        Recent
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateColumn({ sortBy: "hot" })}
                        className={cn(
                          "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
                          column.sortBy === "hot"
                            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
                            : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                        )}
                      >
                        Hot
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateColumn({ sortBy: "votes" })}
                        className={cn(
                          "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
                          column.sortBy === "votes"
                            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
                            : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                        )}
                      >
                        Top
                      </button>
                    </div>
                  </div>

                  {/* Scope Segment */}
                  {user && (
                    <div className="flex flex-col gap-1.5">
                      <span className=" text-neutral-400 uppercase text-[9px] tracking-wider">
                        Scope
                      </span>
                      <div className="flex bg-neutral-100/80 dark:bg-neutral-900/60 p-0.5 rounded-lg border border-neutral-200/40 dark:border-neutral-800/40">
                        <button
                          type="button"
                          onClick={() => onUpdateColumn({ postScope: "all" })}
                          className={cn(
                            "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
                            column.postScope === "all"
                              ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
                              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                          )}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateColumn({ postScope: "my-posts" })
                          }
                          className={cn(
                            "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
                            column.postScope === "my-posts"
                              ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
                              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                          )}
                        >
                          Mine
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chamber Source Selector */}
                <div className="flex flex-col gap-1.5">
                  <span className=" text-neutral-400 uppercase text-[9px] tracking-wider">
                    Source
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-between w-full bg-background rounded-lg border border-neutral-250 dark:border-neutral-800 px-3 py-1.5 text-[11px] text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer">
                      <span className="truncate">
                        {column.chamberSource === "joined"
                          ? "Joined chambers"
                          : column.chamberSource === "following"
                            ? "Following"
                            : column.chamberSource === "global"
                              ? "All chambers"
                              : chambers.find(
                                  (c) => c.uid === column.chamberSource,
                                )?.name || "Select Chamber"}
                      </span>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className="size-3.5 text-neutral-400 shrink-0 ml-1"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-56 max-h-[250px] overflow-y-auto scrollbar-thin"
                    >
                      {hasToken && (
                        <DropdownMenuItem
                          onClick={() =>
                            onUpdateColumn({ chamberSource: "joined" })
                          }
                          className="cursor-pointer"
                        >
                          Joined chambers
                        </DropdownMenuItem>
                      )}
                      {hasToken && (
                        <DropdownMenuItem
                          onClick={() =>
                            onUpdateColumn({ chamberSource: "following" })
                          }
                          className="cursor-pointer"
                        >
                          Following
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          onUpdateColumn({ chamberSource: "global" })
                        }
                        className="cursor-pointer"
                      >
                        All chambers
                      </DropdownMenuItem>
                      {chambers.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="px-3 py-1 text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                            Specific Chambers
                          </div>
                          {chambers.map((c) => (
                            <DropdownMenuItem
                              key={c.uid}
                              onClick={() =>
                                onUpdateColumn({ chamberSource: c.uid })
                              }
                              className="cursor-pointer"
                            >
                              {c.name}
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

              </PopoverPopup>
            </Popover>
          </div>
          {canDelete && (
            <button
              onClick={onDeleteColumn}
              className="p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
              title="Remove column"
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Feed Content Block - natural flow for page scrolling */}
      <div className="rounded-2xl border overflow-hidden">{feedContent}</div>
    </div>
  ) : (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Column Header */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center justify-between pb-2">
          <div className="flex-1 min-w-0 mr-2">
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer border shrink-0 bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-50 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80"
                    title="Configure feed"
                  >
                    <HugeiconsIcon icon={FilterIcon} className="size-3.5" />
                    <span>
                        {column.chamberSource === "joined"
                          ? "Joined Feed"
                          : column.chamberSource === "following"
                            ? "Following Feed"
                            : column.chamberSource === "global"
                              ? "Global Feed"
                          : selectedChamberObj?.name || "Chamber"}
                      {column.postTypeFilter !== "all" &&
                        ` • ${CHANNEL_LABELS[column.postTypeFilter] || column.postTypeFilter.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`}
                      {` • ${column.sortBy === "time_created" ? "Recent" : column.sortBy === "votes" ? "Top Posts" : "Hot"}`}
                    </span>
                  </button>
                }
              />
              <PopoverPopup className="w-80 p-4 bg-background/95 backdrop-blur-md rounded-2xl shadow-xl space-y-4 text-xs">
                {/* Sort & Scope Row */}
                <div
                  className={cn(
                    "grid gap-3",
                    user ? "grid-cols-2" : "grid-cols-1",
                  )}
                >
                  {/* Sort Segment */}
                  <div className="flex flex-col gap-1.5">
                    <span className=" text-neutral-400 uppercase text-[9px] tracking-wider">
                      Sort by
                    </span>
                    <div className="flex bg-neutral-100/80 dark:bg-neutral-900/60 p-0.5 rounded-lg border border-neutral-200/40 dark:border-neutral-800/40">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateColumn({ sortBy: "time_created" })
                        }
                        className={cn(
                          "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
                          column.sortBy === "time_created"
                            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
                            : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                        )}
                      >
                        Recent
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateColumn({ sortBy: "hot" })}
                        className={cn(
                          "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
                          column.sortBy === "hot"
                            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
                            : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                        )}
                      >
                        Hot
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateColumn({ sortBy: "votes" })}
                        className={cn(
                          "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
                          column.sortBy === "votes"
                            ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
                            : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                        )}
                      >
                        Top
                      </button>
                    </div>
                  </div>

                  {/* Scope Segment */}
                  {user && (
                    <div className="flex flex-col gap-1.5">
                      <span className=" text-neutral-400 uppercase text-[9px] tracking-wider">
                        Scope
                      </span>
                      <div className="flex bg-neutral-100/80 dark:bg-neutral-900/60 p-0.5 rounded-lg border border-neutral-200/40 dark:border-neutral-800/40">
                        <button
                          type="button"
                          onClick={() => onUpdateColumn({ postScope: "all" })}
                          className={cn(
                            "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
                            column.postScope === "all"
                              ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
                              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                          )}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateColumn({ postScope: "my-posts" })
                          }
                          className={cn(
                            "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
                            column.postScope === "my-posts"
                              ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
                              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                          )}
                        >
                          Mine
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chamber Source Selector */}
                <div className="flex flex-col gap-1.5">
                  <span className=" text-neutral-400 uppercase text-[9px] tracking-wider">
                    Source
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-between w-full bg-background rounded-lg border border-neutral-250 dark:border-neutral-800 px-3 py-1.5 text-[11px] text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer">
                      <span className="truncate">
                        {column.chamberSource === "joined"
                          ? "Joined chambers"
                          : column.chamberSource === "following"
                            ? "Following"
                            : column.chamberSource === "global"
                              ? "All chambers"
                              : chambers.find(
                                  (c) => c.uid === column.chamberSource,
                                )?.name || "Select Chamber"}
                      </span>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className="size-3.5 text-neutral-400 shrink-0 ml-1"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-56 max-h-[250px] overflow-y-auto scrollbar-thin"
                    >
                      {hasToken && (
                        <DropdownMenuItem
                          onClick={() =>
                            onUpdateColumn({ chamberSource: "joined" })
                          }
                          className="cursor-pointer"
                        >
                          Joined chambers
                        </DropdownMenuItem>
                      )}
                      {hasToken && (
                        <DropdownMenuItem
                          onClick={() =>
                            onUpdateColumn({ chamberSource: "following" })
                          }
                          className="cursor-pointer"
                        >
                          Following
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          onUpdateColumn({ chamberSource: "global" })
                        }
                        className="cursor-pointer"
                      >
                        All chambers
                      </DropdownMenuItem>
                      {chambers.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="px-3 py-1 text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                            Specific Chambers
                          </div>
                          {chambers.map((c) => (
                            <DropdownMenuItem
                              key={c.uid}
                              onClick={() =>
                                onUpdateColumn({ chamberSource: c.uid })
                              }
                              className="cursor-pointer"
                            >
                              {c.name}
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </PopoverPopup>
            </Popover>
          </div>
          {canDelete && (
            <button
              onClick={onDeleteColumn}
              className="p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
              title="Remove column"
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Feed Content Block */}
      <ScrollArea className="flex-1 min-h-0 rounded-2xl border">
        {feedContent}
      </ScrollArea>
    </div>
  );
}

export default function Home() {
  const { data: user, isLoading: isAuthLoading } = useAuth();
  const token = useToken();
  const hasToken = !!token;
  const { open: openAuthModal } = useAuthModal();
  const isMobile = useIsMobile();
  // Columns state
  const [columns, setColumns] = useState<FeedColumn[]>(() => {
    const saved = localStorage.getItem("turnsout_columns");
    if (saved) {
      try {
        const parsed: FeedColumn[] = JSON.parse(saved);
        const migrated = parsed.map((c) => {
          let postTypeFilter = c.postTypeFilter as any;
          if (postTypeFilter === "qna") postTypeFilter = "discussion";
          else if (postTypeFilter === "partner")
            postTypeFilter = "study-partners";
          else if (postTypeFilter === "trade") postTypeFilter = "marketplace";
          else if (postTypeFilter === "taxi") postTypeFilter = "carpools";

          return {
            ...c,
            postTypeFilter: postTypeFilter as any,
            chamberSource:
              !hasToken && (c.chamberSource === "joined" || c.chamberSource === "following")
                ? "global"
                : hasToken && c.chamberSource === "global"
                  ? "joined"
                  : c.chamberSource,
          };
        });
        return migrated;
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: "default-feed",
        title: "Main Feed",
        sortBy: hasToken ? "time_created" : "hot",
        postTypeFilter: "all",
        chamberSource: hasToken ? "joined" : "global",
        postScope: "all",
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("turnsout_columns", JSON.stringify(columns));
  }, [columns]);

  const prevHasToken = useRef(hasToken);
  useEffect(() => {
    if (!prevHasToken.current && hasToken) {
      setColumns((prev) => {
        let changed = false;
        const updated = prev.map((col) => {
          if (col.chamberSource === "global") {
            changed = true;
            return { ...col, chamberSource: "joined" as const };
          }
          return col;
        });
        return changed ? updated : prev;
      });
    } else if (prevHasToken.current && !hasToken) {
      setColumns((prev) => {
        let changed = false;
        const updated = prev.map((col) => {
          if (col.chamberSource === "joined") {
            changed = true;
            return { ...col, chamberSource: "global" as const };
          }
          return col;
        });
        return changed ? updated : prev;
      });
    }
    prevHasToken.current = hasToken;
  }, [hasToken]);

  const handleAddColumn = () => {
    const newCol: FeedColumn = {
      id: `col-${Date.now()}`,
      title: `Column ${columns.length + 1}`,
      sortBy: "time_created",
      postTypeFilter: "all",
      chamberSource: "global",
      postScope: "all",
    };
    setColumns([...columns, newCol]);
  };

  const handleDeleteColumn = (id: string) => {
    setColumns(columns.filter((c) => c.id !== id));
  };

  const handleUpdateColumn = (id: string, updated: Partial<FeedColumn>) => {
    setColumns(columns.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const { mutate: deleteQuestion } = useDeleteQuestion();

  const { data: chambersData } = useListChambers();
  const chambers = chambersData || [];
  const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);
  const visibleColumns = isMobile ? columns.slice(0, 1) : columns;

  return (
    <PageTransition
      className={cn(
        "flex flex-col w-full pt-4 md:pt-6",
        isMobile ? "min-h-dvh overflow-y-auto" : "overflow-hidden h-dvh",
        !isMobile && !user && !isAuthLoading && "pb-20",
      )}
    >
      {isMobile && !user && !isAuthLoading && (
        <div className="w-full shrink-0 px-4 pb-2">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 flex items-center justify-between gap-4">
            <button
              onClick={() => openAuthModal()}
              className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-left cursor-pointer"
            >
              Join your campus community to interact.
            </button>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={() => openAuthModal()}
              >
                Get started
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Columns Dashboard Container */}
      <div
        className={cn(
          isMobile
            ? "flex flex-col gap-4 px-4 pb-4"
            : "flex-1 flex overflow-x-auto gap-8 pb-2 px-4 md:px-8 min-h-0 scrollbar-modern scroll-smooth",
          !isMobile && columns.length === 1 && !user && "sm:justify-center",
        )}
      >
        {visibleColumns.map((col) => (
          <div
            key={col.id}
            className={cn(
              isMobile
                ? "w-full"
                : "flex-shrink-0 w-full sm:w-[36rem] flex flex-col min-h-0",
              !isMobile && columns.length === 1 && user && "sm:mx-auto",
            )}
          >
            <ColumnFeed
              column={col}
              onDeleteColumn={() => handleDeleteColumn(col.id)}
              onUpdateColumn={(updated) => handleUpdateColumn(col.id, updated)}
              user={user}
              hasToken={hasToken}
              chambers={chambers}
              JOINED_CHAMBERS={JOINED_CHAMBERS}
              deleteQuestion={deleteQuestion}
              canDelete={columns.length > 1}
              isMobile={isMobile}
            />
          </div>
        ))}

        {/* Desktop logged-out: CTA card on the right */}
        {!isMobile && !user && !isAuthLoading && (
          <div className="flex-shrink-0 w-80 sm:w-96 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1D1D1D] p-8 flex flex-col gap-5 self-start mt-11">
            <div className="space-y-1">
              <h1 className="text-neutral-800 dark:text-neutral-200 text-lg">
                TurnsOut
              </h1>
              <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance inline-grid">
                <span className="invisible col-start-1 row-start-1 select-none" aria-hidden>
                  Campus questions, answered by the people who get it.
                </span>
                <TextFlip as="span" interval={3} className="col-start-1 row-start-1">
                  <span>Ask. Trade. Ride. Connect.</span>
                  <span>The platform built for campus life.</span>
                  <span>Where students help students.</span>
                  <span>Campus questions, answered by the people who get it.</span>
                  <span>Your campus community, one message away.</span>
                </TextFlip>
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="text-neutral-300 dark:text-neutral-600 mt-0.5">•</span>
                <span>Explore topic-specific chambers and channels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-300 dark:text-neutral-600 mt-0.5">•</span>
                <span>Ask questions and get answers from your campus</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-300 dark:text-neutral-600 mt-0.5">•</span>
                <span>Trade textbooks, electronics, and hostel gear</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-300 dark:text-neutral-600 mt-0.5">•</span>
                <span>Share cabs to airports and weekend trips</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-300 dark:text-neutral-600 mt-0.5">•</span>
                <span>Share lecture notes, resources, and files</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-300 dark:text-neutral-600 mt-0.5">•</span>
                <span>Post anonymously and connect via DMs</span>
              </li>
            </ul>
            <Button
              variant="default"
              className="w-full mt-auto"
              onClick={() => openAuthModal()}
            >
              Get started
            </Button>
          </div>
        )}

        {/* Add Column Button - desktop only */}
        {!isMobile && (
          <button
            onClick={handleAddColumn}
            className={cn(
              "flex-shrink-0 flex items-center justify-center size-8 rounded-full border border-dashed self-center transition-all",
              user
                ? "border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer visible"
                : "border-transparent text-transparent pointer-events-none invisible",
            )}
            title="Add Column"
            aria-label="Add Column"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
          </button>
        )}
      </div>
    </PageTransition>
  );
}
