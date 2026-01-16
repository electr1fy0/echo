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

import type { Question } from "./types";

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
    <AccordionItem value={question.uid ?? ""}>
      <AccordionTrigger className="font-normal">
        {question.content}
      </AccordionTrigger>

      <AccordionContent>
        {answers?.map((a) => (
          <div
            key={a.uid}
            className="border-b text-neutral-600 py-2 text-sm border-neutral-200"
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
    <Accordion>
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
      <div className="max-w-xl w-full mt-40 space-y-4 mb-40 ">
        <h1 className="text-neutral-800 text-lg py-0 my-0">Echo</h1>
        <h2 className="text-neutral-600 text-sm">An Open QnA platform</h2>

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
