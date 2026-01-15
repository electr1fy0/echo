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

function QuestionItem({
  q,
  answers,
  onOpen,
}: {
  q: Question;
  answers: Answer[];
  onOpen: (id: string) => void;
}) {
  const [content, setContent] = useState("");

  const submitReply = async () => {
    if (!content.trim()) return;
    await fetch(
      `http://localhost:8080/questions/${encodeURIComponent(q.uid)}/replies`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
        headers: { "Content-Type": "application/json" },
      },
    );
    setContent("");
    onOpen(q.uid);
  };

  return (
    <AccordionItem key={q.uid} value={q.uid}>
      <AccordionTrigger className="font-normal text-base text-neutral-700">
        {q.content}
      </AccordionTrigger>
      <AccordionContent className="text-neutral-600 relative min-h-24">
        <div className="space-y-2">
          {answers ? (
            answers.map((a) => (
              <div
                key={a.uid}
                className="border-b ml-0.5 border-neutral-100 pb-1"
              >
                {a.content}
              </div>
            ))
          ) : (
            <div className=" text-neutral-500 ml-1.5 ">No replies</div>
          )}
        </div>
        <div className="relative mt-10 flex gap-2">
          <Input
            placeholder="Answer bro's query"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button variant="outline" onClick={submitReply}>
            Reply
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function AccordionList({ questions }: { questions: Question[] }) {
  const [answersByQid, setAnswersByQid] = useState<Record<string, Answer[]>>(
    {},
  );
  const [openQids, setOpenQids] = useState<string[]>([]);

  const getAnswers = async (qid: string) => {
    const resp = await fetch(
      `http://localhost:8080/questions/${encodeURIComponent(qid)}/replies`,
      {
        method: "GET",
      },
    );
    const data = await resp.json();
    setAnswersByQid((prev) => ({ ...prev, [qid]: data }));
  };

  if (questions.length < 1)
    return (
      <div className="text-neutral-500 text-center">Be the first to ask.</div>
    );

  return (
    <Accordion
      className="w-full"
      value={openQids}
      onValueChange={(next) => {
        setOpenQids(next);
        const newlyOpened = next.find((id) => !openQids.includes(id));
        if (newlyOpened) getAnswers(newlyOpened);
      }}
    >
      {questions.map((q) => (
        <QuestionItem
          key={q.uid}
          q={q}
          answers={answersByQid[q.uid]}
          onOpen={getAnswers}
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
        <Button onClick={submitQuestion}>Ask Query</Button>
        <div className="mt-20">
          <AccordionList questions={questions} />
        </div>
      </div>
    </div>
  );
}
