import { useState } from "react";
import {
  useQuestionDraft,
  useQuestionsQuery,
  useCreateQuestion,
  useDeleteQuestion,
} from "@/hooks/use-questions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import { Add01Icon, Time02Icon, FireIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export function Home() {
  const [activeTab, setActiveTab] = useState<"recent" | "trending">("recent");
  const {
    data: questions = [],
    isLoading,
    error,
  } = useQuestionsQuery(0, 10, activeTab === "trending" ? "votes" : undefined);
  const { mutate: submitQuestion, isPending: isCreatePending } =
    useCreateQuestion();
  const { draft, updateDraft, resetDraft } = useQuestionDraft();
  const { mutate: deleteQuestion } = useDeleteQuestion();

  const handleSubmit = () => {
    submitQuestion(draft, {
      onSuccess: resetDraft,
    });
  };

  return (
    <div className="max-w-xl w-full md:mt-40 mt-24 space-y-4 mb-40 relative px-4 pb-20 md:pb-0">
      <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0 text-balance">
        Echo
      </h1>
      <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance">
        An Open QnA platform
      </h2>
      <Textarea
        placeholder="Why do cats always land on their feet?"
        aria-label="Question content"
        className="resize-none h-20"
        value={draft.content}
        onChange={(e) => updateDraft({ content: e.target.value })}
      />

      <div className="flex justify-end items-center mt-4">
        <Button
          className="font-normal rounded-xl "
          onClick={handleSubmit}
          disabled={isCreatePending}
        >
          <HugeiconsIcon icon={Add01Icon} className="mr-0 size-4 " />
          Ask Query
        </Button>
      </div>
      <div className="my-10">
        <div className="flex gap-2 my-4">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("recent")}
            className={cn(
              "h-8 rounded-full text-sm px-4 transition-all gap-2 border",
              activeTab === "recent"
                ? "border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
            )}
          >
            <HugeiconsIcon
              icon={Time02Icon}
              className="size-4"
              strokeWidth={2}
            />
            Recent
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("trending")}
            className={cn(
              "h-8 rounded-full text-sm px-4 transition-all gap-2 border",
              activeTab === "trending"
                ? "border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
            )}
          >
            <HugeiconsIcon icon={FireIcon} className="size-4" strokeWidth={2} />
            Trending
          </Button>
        </div>

        {isLoading ? (
          <QuestionListSkeleton count={4} />
        ) : error ? (
          <p className="text-red-500 text-sm">Failed to load questions</p>
        ) : (
          <QuestionList
            questions={questions}
            onDelete={(id) => deleteQuestion(id)}
          />
        )}
      </div>
    </div>
  );
}
