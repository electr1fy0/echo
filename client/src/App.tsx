import { useEffect, useState } from "react";
import { useQuestions } from "./hooks/use-questions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./components/ui/button";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import type { Question, Answer } from "./types";
import { Input } from "./components/ui/input";
type AccordionProps = {
  questions: Question[];
};

function AccordionList({ questions }: AccordionProps) {
  const [reply, setReply] = useState<Answer>({ content: "" });
  const [answers, setAnswers] = useState<Answer[]>([]);

  const getAnswers = async () => {
    const resp = await fetch("http://localhost:8080/replies", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await resp.json();
    setAnswers(data);
  };
  const submitReply = async (uid: string) => {
    console.log(uid);
    await fetch(
      `http://localhost:8080/questions/${encodeURIComponent(uid)}/replies`,
      {
        method: "POST",
        body: JSON.stringify(reply),
        headers: { "Content-Type": "application/json" },
      },
    );
  };
  const updateReply = (fields: Partial<Answer>) => {
    setReply((prev) => {
      return { ...prev, ...fields };
    });
  };
  if (questions.length < 1)
    return (
      <div className="text-neutral-500 text-center">
        Be the first to ask a query.
      </div>
    );
  return (
    <Accordion className="w-full">
      {questions.map((q, i) => (
        <AccordionItem key={i} value={`${i}`}>
          <AccordionTrigger
            className="font-normal text-base text-neutral-700"
            // onClick={}
          >
            {q.content}
          </AccordionTrigger>
          <AccordionContent className="text-neutral-600 relative min-h-24">
            <div>{q.content}</div>
            <div className="relative mt-10 ">
              <Input
                placeholder="Answer bro's query"
                onChange={(e) => updateReply({ content: e.target.value })}
              />
              <Button
                variant="outline"
                className="absolute right-0 top-1/2 -translate-y-1/2  py-1 px-3 text-sm"
                onClick={() => submitReply(q.uid)}
              >
                Reply
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function App() {
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

        <Button variant="default" onClick={submitQuestion}>
          Ask Query
        </Button>
        <div className="my-20">
          <AccordionList questions={questions} />
        </div>
      </div>
    </div>
  );
}

export default App;
