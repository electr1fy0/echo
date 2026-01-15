import { useEffect, useState } from "react";
import { useQuestions } from "./hooks/use-questions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Question, Answer } from "./types";
import { useReplies } from "./hooks/user-replies";

type QuestionItemProps = {
  question: Question;
  answers: Answer[];
  submitReply: (qid: string) => Promise<void>;
  getAnswers: (qid: string) => Promise<void>;
  replyContent: string;
  setReplyContent: (v: string) => void;
};

function QuestionItem({
  question,
  answers,
  submitReply,
  getAnswers,
  replyContent,
  setReplyContent,
}: QuestionItemProps) {
  return (
    <AccordionItem value={question.uid}>
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

          <Button
            variant="outline"
            onClick={async () => {
              await submitReply(question.uid ?? "");
              await getAnswers(question.uid ?? "");
            }}
          >
            Reply
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
function AccordionList({ questions }: { questions: Question[] }) {
  const {
    openQids,
    setOpenQids,
    repliesByQid,
    setRepliesByQid,
    submitReply,
    replyContent,
    setReplyContent,
  } = useReplies();

  const getAnswers = async (qid: string) => {
    const resp = await fetch(
      `http://localhost:8080/questions/${encodeURIComponent(qid)}/replies`,
    );
    const data = await resp.json();
    setRepliesByQid((prev) => ({ ...prev, [qid]: data }));
  };

  return (
    <Accordion
      value={openQids}
      onValueChange={(next) => {
        const newlyOpened = next.find((q) => !openQids.includes(q));
        if (newlyOpened) getAnswers(newlyOpened);
        setOpenQids(next);
      }}
    >
      {questions.map((q) => (
        <QuestionItem
          key={q.uid}
          question={q}
          answers={repliesByQid[q.uid ?? ""]}
          submitReply={submitReply}
          getAnswers={getAnswers}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
        />
      ))}
    </Accordion>
  );
}

export default function App() {
  const {
    fetchQuestions,
    submitQuestion,
    updateQuestion,
    question,
    questions,
  } = useQuestions();

  useEffect(() => {
    fetchQuestions();
  }, []);

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
        <Button className="font-normal" onClick={submitQuestion}>
          Ask Query
        </Button>
        <div className="mt-20">
          <AccordionList questions={questions} />
        </div>
      </div>
    </div>
  );
}
