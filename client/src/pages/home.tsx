import { useState } from "react";
import {
  useQuestionDraft,
  useCreateQuestion,
  useDeleteQuestion,
  useQuestionsQuery,
} from "@/hooks/use-questions";
import { Textarea } from "@/components/ui/textarea";
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
import { CHAMBER_COLORS } from "@/components/chambers/consts";
export function Home() {
  const [activeTab, setActiveTab] = useState<"recent" | "trending">("recent");
  const [selectedChamber, setSelectedChamber] = useState<string>("");
  const { mutate: submitQuestion, isPending: isCreatePending } =
    useCreateQuestion();
  const { draft, updateDraft, resetDraft } = useQuestionDraft();
  const { mutate: deleteQuestion } = useDeleteQuestion();
  const { data: chambers = [] } = useListChambers();
  const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);
  const { data: questions = [], isLoading: isQuestionsLoading } =
    useQuestionsQuery(
      0,
      50,
      activeTab === "trending" ? "votes" : "time_created",
      "joined",
    );
  const selectedChamberData = JOINED_CHAMBERS.find(
    (c) => c.uid === selectedChamber,
  );
  const handleSubmit = () => {
    if (!draft.content.trim() || !selectedChamber) return;
    submitQuestion(
      { ...draft, chamberUid: selectedChamber },
      {
        onSuccess: () => {
          resetDraft();
          setSelectedChamber("");
        },
      },
    );
  };
  return (
    <div className="max-w-[40rem] w-full md:mt-40 mt-24 space-y-4 mb-40 relative px-4 pb-20 md:pb-0">
      <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0 text-balance">
        Echo
      </h1>
      <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance">
        An Open QnA platform
      </h2>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-xl gap-2 h-9 px-3 text-sm border border-neutral-200 dark:border-neutral-700 bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              {selectedChamberData ? (
                <>
                  <div
                    className={cn(
                      "size-3 rounded-full",
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
                    className="size-4 text-neutral-500"
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
          {selectedChamberData && (
            <span className="text-xs text-neutral-500">
              Posting to {selectedChamberData.name}
            </span>
          )}
        </div>
        <Textarea
          placeholder={
            selectedChamberData
              ? `Ask in ${selectedChamberData.name}...`
              : "Select a chamber to ask a question..."
          }
          aria-label="Question content"
          className="resize-none h-20"
          value={draft.content}
          onChange={(e) => updateDraft({ content: e.target.value })}
        />
        <div className="flex justify-end items-center">
          <div className={cn(!selectedChamberData && "ml-auto")}>
            <Button
              className="font-normal rounded-xl"
              onClick={handleSubmit}
              disabled={
                isCreatePending || !selectedChamber || !draft.content.trim()
              }
            >
              <HugeiconsIcon icon={Add01Icon} className="mr-0 size-4" />
              Ask Query
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
        {JOINED_CHAMBERS.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">You haven't joined any chambers yet.</p>
            <p className="text-xs mt-1">
              Explore chambers to see questions here.
            </p>
          </div>
        ) : isQuestionsLoading ? (
          <QuestionListSkeleton count={3} />
        ) : questions.length > 0 ? (
          <QuestionList
            questions={questions}
            onDelete={(id) => deleteQuestion(id)}
          />
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">No questions in your feed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
