import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { QuestionList } from "@/components/questions/question-list";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  useDeleteQuestion,
} from "@/hooks/use-questions";
import { useBookmarksQuery } from "@/hooks/use-bookmarks";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";

import { PageTransition } from "@/components/page-transition";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { Bookmark01Icon } from "@hugeicons/core-free-icons";

export default function Bookmarks() {
  const [query, setQuery] = useState("");

  const { data: bookmarks, isLoading } = useBookmarksQuery(50, query || undefined);
  const { mutate: deleteQuestion } = useDeleteQuestion();

  const filteredBookmarks = useMemo(() => {
    if (!bookmarks) return [];
    if (!query) return bookmarks;
    const q = query.toLowerCase();
    return bookmarks.filter((item) =>
      item.question.content.toLowerCase().includes(q),
    );
  }, [bookmarks, query]);

  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 space-y-4 pb-36 md:pb-16 relative px-4">
      <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0 text-balance">
        Saved
      </h1>
      <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance">
        Posts you've bookmarked for later.
      </h2>
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500 pointer-events-none"
        />
        <Input
          placeholder="Search saved posts..."
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

      <div className="space-y-4">
        {isLoading ? (
          <QuestionListSkeleton />
        ) : filteredBookmarks.length > 0 ? (
          <div className="border border-neutral-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden">
            <QuestionList
              questions={filteredBookmarks}
              onDelete={(id) => deleteQuestion(id)}
              showChamberName
            />
          </div>
        ) : (
          <EmptyState
            icon={
              <HugeiconsIcon icon={Bookmark01Icon} className="size-8 opacity-50" />
            }
            title={query ? "No saved posts match your search" : "No saved posts yet"}
            description={query ? "Try a different search term" : "Bookmark posts to find them later"}
          />
        )}
      </div>
    </PageTransition>
  );
}
