import { useQuestions } from "./hooks/use-questions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
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
export function AccordionDemo({ questions }: AccordionProps) {
  console.log("qns: ", questions);
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      {questions.map((q, i) => {
        console.log(i);
        return (
          <AccordionItem value="item-1">
            <AccordionTrigger>{q.title}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <h3>
                Our flagship product combines cutting-edge technology with sleek
                design. Built with premium materials, it offers unparalleled
                performance and reliability.
              </h3>
              <p>{q.content}</p>
            </AccordionContent>
          </AccordionItem>
        );
      })}
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
  }, [questions]);

  return (
    <div className="flex justify-start items-center flex-col min-h-screen gap-4">
      <div className="max-w-xl w-full">
        <div className="w-full  mt-40 space-y-2">
          <h1 className="text-neutral-700 ml-1 text-lg "> Ask a Query</h1>
          <Input placeholder="Enter Title"></Input>
          <Textarea
            placeholder="Enter Description"
            className="resize-none h-20"
          ></Textarea>
        </div>
        <main className="w-full">
          <AccordionDemo questions={questions}></AccordionDemo>
        </main>
      </div>
    </div>
  );
}
export default App;
