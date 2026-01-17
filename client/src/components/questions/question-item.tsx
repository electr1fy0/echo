import {
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
import { useRepliesQuery, useDeleteReply } from "@/hooks/use-replies";
import { useUpdateVote } from "@/hooks/use-upvote";
import type { Question } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  Delete02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { UpvoteButton } from "../upvote-button";
import { ReplyItem } from "./reply-item";
import { ReplyForm } from "./reply-form";

type QuestionItemProps = {
  question: Question;
  onDelete: (id: string) => void;
};

export function QuestionItem({ question, onDelete }: QuestionItemProps) {
  const questionId = question.uid ?? "";
  const { data: replies = [] } = useRepliesQuery(questionId || undefined);
  const { mutate: deleteReply } = useDeleteReply();
  const { mutate: handleVote } = useUpdateVote();
  if (!questionId) {
    return null;
  }

  return (
    <AccordionItem value={questionId} className="w-full">
      <AccordionTrigger className="font-normal pr-4 hover:no-underline">
        <div className="flex-1 text-left pt-1.5 dark:text-neutral-300 text-neutral-900">
          {question.content}
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2"
        >
          <UpvoteButton
            count={question.upvotes}
            isUpvoted={question.isUpvoted}
            onToggle={() => handleVote(questionId)}
            className="border border-neutral-200 w-14 text-right dark:border-neutral-800 rounded-full h-7 px-2.5 bg-neutral-50 dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors mr-2"
          />
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Button
                variant="ghost"
                size="icon"
                aria-label="More options"
                className="h-7 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
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
                onClick={() => onDelete(questionId)}
              >
                <HugeiconsIcon icon={Delete02Icon} className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        {replies ? (
          replies.map((reply, index) => (
            <ReplyItem
              key={reply.uid ?? index}
              reply={reply}
              onDelete={() =>
                deleteReply({ questionId, replyId: reply.uid ?? "" })
              }
            />
          ))
        ) : (
          <div className="text-sm ml-1 text-neutral-500">No replies</div>
        )}
        <ReplyForm questionId={questionId} />
      </AccordionContent>
    </AccordionItem>
  );
}
