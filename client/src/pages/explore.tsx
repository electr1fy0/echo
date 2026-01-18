import { useState } from "react";
import { Input } from "@/components/ui/input";
import { QuestionList } from "@/components/questions/question-list";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    useSearchQuestions,
    useDeleteQuestion,
    useQuestionsQuery,
} from "@/hooks/use-questions";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";

export function Explore() {
    const [query, setQuery] = useState("");

    const { data: searchResults = [], isLoading: isSearching } =
        useSearchQuestions(query);

    const {
        data: trendingQuestions = [],
        isLoading: isTrendingLoading,
        error: trendingError,
    } = useQuestionsQuery(0, 20, "votes");

    const { mutate: deleteQuestion } = useDeleteQuestion();

    const isSearchMode = query.length > 0;
    const questions = isSearchMode ? searchResults : trendingQuestions;
    const isLoading = isSearchMode ? isSearching : isTrendingLoading;

    return (
        <div className="max-w-xl w-full mt-40 space-y-6 mb-40 relative px-4 pb-20 md:pb-0">
            <div className="relative">
                <HugeiconsIcon
                    icon={Search01Icon}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 size-5"
                />
                <Input
                    placeholder="Search for questions..."
                    className="pl-10 h-10 bg-neutral-100 dark:bg-neutral-800/50 border-transparent focus-visible:bg-transparent border-neutral-200 dark:border-neutral-700 rounded-2xl"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
                    {isSearchMode
                        ? questions.length > 0
                            ? "Results"
                            : "No results found"
                        : "Trending"}
                </h3>

                {isLoading ? (
                    <QuestionListSkeleton count={4} />
                ) : trendingError && !isSearchMode ? (
                    <p className="text-red-500 text-sm px-1">Failed to load questions</p>
                ) : questions.length > 0 ? (
                    <QuestionList
                        questions={questions}
                        onDelete={(id) => deleteQuestion(id)}
                    />
                ) : null}
            </div>
        </div>
    );
}
