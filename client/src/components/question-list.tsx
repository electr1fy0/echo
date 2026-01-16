import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRepliesQuery, useCreateReply } from "@/hooks/use-replies";
import type { Question } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  Delete02Icon,
  PencilEdit02Icon,
  Comment01Icon,
} from "@hugeicons/core-free-icons";

type QuestionItemProps = {
  question: Question;
  replyContent: string;
  setReplyContent: (v: string) => void;
  onDelete: (id: string) => void;
};

function QuestionItem({
  question,
  replyContent,
  setReplyContent,
  onDelete,
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
    <AccordionItem value={question.uid ?? ""} className="w-full">
      <AccordionTrigger className="font-normal">
        <div className="flex-1 text-left">{question.content}</div>
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2"
        >
          {/* Using MoreHorizontalIcon for the menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <HugeiconsIcon
                  icon={PencilEdit02Icon}
                  className="mr-2 size-4"
                />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(question.uid ?? "")}
              >
                <HugeiconsIcon icon={Delete02Icon} className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        {answers?.map((a) => (
          <div
            key={a.uid}
            className="border-b text-neutral-600 dark:text-neutral-400 py-2 text-sm border-neutral-200 dark:border-neutral-700"
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
            <HugeiconsIcon icon={Comment01Icon} className="mr-1 size-4" />
            Reply
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function QuestionList({
  questions,
  onDelete,
}: {
  questions: Question[];
  onDelete: (id: string) => void;
}) {
  const [replyContent, setReplyContent] = useState("");

  return (
    <Accordion className="dark:bg-[#1D1D1D]">
      {questions.map((q) => (
        <QuestionItem
          key={q.uid}
          question={q}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          onDelete={onDelete}
        />
      ))}
    </Accordion>
  );
}
