import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/questions/question-list";
import { Search01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useDeleteQuestion, useQuestionsQuery } from "@/hooks/use-questions";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import { ChamberListSkeleton } from "@/components/ui/skeletons";
import {
  ChamberList,
  CreateChamberButton,
} from "@/components/chambers/chamber-list";
import { CreateChamberDialog } from "@/components/chambers/create-chamber-dialog";
import { useListChambers } from "@/hooks/use-chamber";
import { useGlobalSearch } from "@/hooks/use-search";
import type { AnswerItem } from "@/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useNavigate } from "react-router";
import { formatRelativeTime } from "@/lib/format-time";
function ReplyResult({ item }: { item: AnswerItem }) {
  return (
    <div
      className="p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
    >
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
                ? formatRelativeTime(new Date(item.answer.timeCreated))
                : ""}
            </span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2">
            {item.answer.content}
          </p>
          <p className="text-xs text-neutral-400 mt-2">Replied to a question</p>
        </div>
      </div>
    </div>
  );
}
export function Explore() {
  const [query, setQuery] = useState("");
  const [createChamberOpen, setCreateChamberOpen] = useState(false);
  const navigate = useNavigate();

  const { data: searchResults, isLoading: isSearching } =
    useGlobalSearch(query);
  const {
    data: trendingQuestions = [],
    isLoading: isTrendingLoading,
    error: trendingError,
  } = useQuestionsQuery("votes");
  const { mutate: deleteQuestion } = useDeleteQuestion();
  const { data: chambers = [], isLoading: isChambersLoading } = useListChambers();

  const isSearchMode = query.length > 0;
  const isLoading = isSearchMode ? isSearching : isTrendingLoading;

  return (
    <div className="max-w-[40rem] w-full md:mt-24 mt-16 space-y-4 mb-40 relative px-4 pb-20 md:pb-0">
      <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0 text-balance">
        Explore
      </h1>
      <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance">
        Discover for questions, chambers, and users
      </h2>
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 size-5"
        />
        <Input
          placeholder="Search for anything..."
          className="pl-10 h-10 bg-neutral-100 dark:bg-neutral-800/50 border-transparent focus-visible:bg-transparent border-neutral-200 dark:border-neutral-700 rounded-2xl"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {isSearchMode ? (
        <div className="space-y-8">
          {isLoading ? (
            <QuestionListSkeleton count={3} />
          ) : searchResults ? (
            <>
              {searchResults.users.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
                    Users
                  </h3>
                  <div className="flex flex-col gap-2">
                    {searchResults.users.map((user) => (
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
              {searchResults.chambers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
                    Chambers
                  </h3>
                  <ChamberList chambers={searchResults.chambers} />
                </div>
              )}
              {searchResults.questions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
                    Questions
                  </h3>
                  <QuestionList
                    questions={searchResults.questions}
                    onDelete={deleteQuestion}
                  />
                </div>
              )}
              {searchResults.replies.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
                    Replies
                  </h3>
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
                    {searchResults.replies.map((reply) => (
                      <ReplyResult key={reply.answer.uid} item={reply} />
                    ))}
                  </div>
                </div>
              )}
              {searchResults.users.length === 0 &&
                searchResults.chambers.length === 0 &&
                searchResults.questions.length === 0 &&
                searchResults.replies.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-10">
                    No results found for "{query}"
                  </p>
                )}
            </>
          ) : null}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                Top Chambers
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => navigate("/chambers")}
              >
                View all
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
              </Button>
            </div>
            {isChambersLoading ? (
              <ChamberListSkeleton count={3} />
            ) : (
              <ChamberList chambers={chambers} limit={3} />
            )}
            <CreateChamberButton onClick={() => setCreateChamberOpen(true)} />
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
              Trending Questions
            </h3>
            {isTrendingLoading ? (
              <QuestionListSkeleton count={4} />
            ) : trendingError ? (
              <p className="text-red-500 text-sm px-1">
                Failed to load questions
              </p>
            ) : (
              <QuestionList
                questions={trendingQuestions}
                onDelete={(id) => deleteQuestion(id)}
              />
            )}
          </div>
        </>
      )}
      <CreateChamberDialog
        open={createChamberOpen}
        onOpenChange={setCreateChamberOpen}
      />
    </div>
  );
}
