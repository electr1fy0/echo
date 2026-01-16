import { useState } from "react";
import {
  useQuestionDraft,
  useQuestionsQuery,
  useCreateQuestion,
} from "./hooks/use-questions";
import { useRepliesQuery, useCreateReply } from "./hooks/use-replies";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun02Icon, MoonIcon } from "@hugeicons/core-free-icons";

import type { Question } from "./types";
import { useTheme } from "./components/theme-provider";

type QuestionItemProps = {
  question: Question;
  replyContent: string;
  setReplyContent: (v: string) => void;
};

function QuestionItem({
  question,
  replyContent,
  setReplyContent,
}: QuestionItemProps) {
  const { data: answers = [] } = useRepliesQuery(question.uid);
  const { mutate: submitReply, isPending } = useCreateReply(question.uid ?? "");

  const handleSubmit = () => {
    if (!replyContent.trim()) return;
    submitReply(replyContent, {
      onSuccess: () => setReplyContent(""),
    });
  };

  return (
    <AccordionItem value={question.uid ?? ""} className="w-full pr-2">
      <div className="flex items-center justify-between">
        <AccordionTrigger className="font-normal ">
          <div>{question.content}</div>
        </AccordionTrigger>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="xs"
              className="dark:text-neutral-300 pb-2 "
              onClick={(e) => {
                e.stopPropagation();
                console.log("more");
              }}
            >
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AccordionContent>
        {answers?.map((a) => (
          <div
            key={a.uid}
            className="border-b text-neutral-600 dark:text-neutral-400 py-2 text-sm border-neutral-200 dark:border-neutral-800"
          >
            {a.content}
          </div>
        ))}

        <div className="flex gap-4 mt-4">
          <Input
            value={replyContent}
            placeholder="Answer bro's query"
            onChange={(e) => setReplyContent(e.target.value)}
          />

          <Button variant="outline" onClick={handleSubmit} disabled={isPending}>
            Reply
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function AccordionList({ questions }: { questions: Question[] }) {
  const [replyContent, setReplyContent] = useState("");

  return (
    <Accordion className="dark:bg-[#1D1D1D]">
      {questions.map((q) => (
        <QuestionItem
          key={q.uid}
          question={q}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
        />
      ))}
    </Accordion>
  );
}

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon">
          <HugeiconsIcon
            icon={Sun02Icon}
            className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          />
          <HugeiconsIcon
            icon={MoonIcon}
            className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function App() {
  const { data: questions = [], isLoading, error } = useQuestionsQuery(0, 10);
  const { mutate: submitQuestion, isPending } = useCreateQuestion();
  const { question, updateQuestion, setQuestion } = useQuestionDraft();

  const handleSubmit = () => {
    submitQuestion(question, {
      onSuccess: () => setQuestion({ content: "" }),
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="max-w-xl w-full mt-40 space-y-4 mb-40 relative">
        <div className="absolute top-0 right-0">
          <ModeToggle />
        </div>
        <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0">
          Echo
        </h1>
        <h2 className="text-neutral-600 dark:text-neutral-400 text-sm">
          An Open QnA platform
        </h2>
        <Textarea
          placeholder="Why do cats always land on their feet?"
          className="resize-none h-20"
          value={question.content}
          onChange={(e) => updateQuestion({ content: e.target.value })}
        />
        <Button
          className="font-normal"
          onClick={handleSubmit}
          disabled={isPending}
        >
          Ask Query
        </Button>
        <div className="mt-20">
          {isLoading ? (
            <p className="text-neutral-500 text-sm">Loading questions...</p>
          ) : error ? (
            <p className="text-red-500 text-sm">Failed to load questions</p>
          ) : (
            <AccordionList questions={questions} />
          )}
        </div>
      </div>
    </div>
  );
}
