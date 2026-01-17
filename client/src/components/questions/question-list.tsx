import { QuestionItem } from "./question-item";
import type { Question } from "@/types";
import { Accordion } from "@/components/ui/accordion";

type QuestionListProps = {
  questions: Question[];
  onDelete: (id: string) => void;
};

export function QuestionList({ questions, onDelete }: QuestionListProps) {
  return (
    <Accordion className="dark:bg-[#1D1D1D]">
      {questions.map((question, index) => (
        <QuestionItem
          key={question.uid ?? index}
          question={question}
          onDelete={onDelete}
        />
      ))}
    </Accordion>
  );
}
