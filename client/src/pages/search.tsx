import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { QuestionList } from "@/components/question-list";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Question } from "@/types";

const MOCK_QUESTIONS: Question[] = [
    { uid: "1", content: "Why do cats always land on their feet?", timeCreated: new Date() },
    { uid: "2", content: "What is the best way to learn React?", timeCreated: new Date() },
    { uid: "3", content: "How does the event loop work in JavaScript?", timeCreated: new Date() },
    { uid: "4", content: "What are the differences between SQL and NoSQL databases?", timeCreated: new Date() },
    { uid: "5", content: "Can someone explain closure in simple terms?", timeCreated: new Date() },
    { uid: "6", content: "Best practices for accessible web design?", timeCreated: new Date() },
    { uid: "7", content: "Why is TypeScript becoming so popular?", timeCreated: new Date() },
    { uid: "8", content: "How to deploy a Node.js app to production?", timeCreated: new Date() },
];

export function Search() {
    const [query, setQuery] = useState("");

    const filteredQuestions = useMemo(() => {
        if (!query) return [];
        return MOCK_QUESTIONS.filter((q) =>
            q.content.toLowerCase().includes(query.toLowerCase())
        );
    }, [query]);


    const handleDelete = (id: string) => {
        console.log("Deleting question with id:", id);
    };

    return (
        <div className="max-w-xl w-full mt-40 space-y-8 mb-40 relative px-4 pb-20 md:pb-0">
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
                    autoFocus
                />
            </div>

            <div className="space-y-4">
                {query ? (
                    <>
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 px-1">
                            {filteredQuestions.length > 0 ? "Results" : "No results found"}
                        </h3>
                        {filteredQuestions.length > 0 && (
                            <QuestionList
                                questions={filteredQuestions}
                                onDelete={handleDelete}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-2">
                        <HugeiconsIcon icon={Search01Icon} className="size-8 opacity-20" />
                        <p className="text-sm">Type to search community questions</p>
                    </div>
                )}
            </div>
        </div>
    );
}
