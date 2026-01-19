import type { QuestionItem } from "@/types";
import { QuestionItem as QuestionItemComponent } from "./question-item";
import { Accordion } from "@/components/ui/accordion";
type QuestionListProps = {
  questions: QuestionItem[];
  onDelete?: (id: string) => void;
  showChamberName?: boolean;
};
export function QuestionList({ questions, onDelete, showChamberName }: QuestionListProps) {
  return questions.length > 0 ? (
    <Accordion className="dark:bg-[#1D1D1D]">
      {questions.map((questionItem, index) => (
        <QuestionItemComponent
          key={questionItem.question.uid ?? index}
          questionItem={questionItem}
          onDelete={onDelete || (() => { })}
          showChamberName={showChamberName}
        />
      ))}
    </Accordion>
  ) : (
    <div className="text-neutral-500 text-center">Ask the first question.</div>
  );
}
