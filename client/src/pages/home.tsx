import {
  useQuestionDraft,
  useQuestionsQuery,
  useCreateQuestion,
  useDeleteQuestion,
} from "@/hooks/use-questions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/questions/question-list";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function Home() {
  const { data: questions = [], isLoading, error } = useQuestionsQuery(0, 10);
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
    <div className="max-w-xl w-full mt-40 space-y-4 mb-40 relative px-4 pb-20 md:pb-0">
      <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0">
        Echo
      </h1>
      <h2 className="text-neutral-600 dark:text-neutral-400 text-sm">
        An Open QnA platform
      </h2>
      <Textarea
        placeholder="Why do cats always land on their feet?"
        className="resize-none h-20"
        value={draft.content}
        onChange={(e) => updateDraft({ content: e.target.value })}
      />

      <div className="flex justify-end">
        <Button
          className="font-normal"
          onClick={handleSubmit}
          disabled={isCreatePending}
        >
          <HugeiconsIcon icon={Add01Icon} className="mr-0 size-4" />
          Ask Query
        </Button>
      </div>
      <div className="mt-20">
        {isLoading ? (
          <p className="text-neutral-500 text-sm">Loading questions...</p>
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
