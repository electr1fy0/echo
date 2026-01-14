import { useEffect } from "react";
import { useQuestions } from "./hooks/use-questions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "./components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Question } from "./types";

type AccordionProps = {
  questions: Question[];
};

function AccordionDemo({ questions }: AccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {questions.map((q, i) => (
        <AccordionItem key={i} value={`${i}`}>
          <AccordionTrigger className="font-normal text-base text-neutral-700">
            {q.title}
          </AccordionTrigger>
          <AccordionContent className="text-neutral-600">
            {q.content}
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
      <div className="max-w-xl w-full mt-40 space-y-4">
        <h1 className="text-neutral-700 text-lg">Ask a Query</h1>

        <Input
          placeholder="Enter Title"
          value={question.title}
          onChange={(e) => updateQuestion({ title: e.target.value })}
        />

        <Textarea
          placeholder="Enter Description"
          className="resize-none h-20"
          value={question.content}
          onChange={(e) => updateQuestion({ content: e.target.value })}
        />

        <Button variant="outline" onClick={submitQuestion}>
          Submit
        </Button>

        <AccordionDemo questions={questions} />
      </div>
    </div>
  );
}

export default App;
