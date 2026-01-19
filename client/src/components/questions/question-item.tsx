import { useState } from "react";
import { Link } from "react-router";
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
import { Textarea } from "@/components/ui/textarea";
import { useRepliesQuery, useDeleteReply } from "@/hooks/use-replies";
import { useUpdateVote } from "@/hooks/use-upvote";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateQuestion } from "@/hooks/use-questions";
import type { QuestionItem } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  Delete02Icon,
  PencilEdit02Icon,
  Copy01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";
import { UpvoteButton } from "../upvote-button";
import { ReplyItem } from "./reply-item";
import { ReplyForm } from "./reply-form";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeTime } from "@/lib/format-time";
import { toast } from "sonner";

type QuestionItemProps = {
  questionItem: QuestionItem;
  onDelete: (id: string) => void;
};

export function QuestionItem({ questionItem, onDelete }: QuestionItemProps) {
  const question = questionItem?.question;
  const author = questionItem?.author ?? null;
  const questionId = question?.uid;

  const { data: replies = [] } = useRepliesQuery(questionId || undefined);
  const { mutate: deleteReply } = useDeleteReply();
  const { mutate: handleVote, isPending: isVotePending } = useUpdateVote();
  const { data: user } = useAuth();
  const { mutate: updateQuestion, isPending: isUpdatePending } =
    useUpdateQuestion();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(question?.content ?? "");

  if (!question || !questionId) return null;

  function handleSave() {
    if (!questionId) return;
    if (!editedContent.trim()) return;
    updateQuestion(
      { questionId, content: editedContent },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  }

  return (
    <AccordionItem value={questionId} className="w-full">
      <AccordionTrigger
        className="font-normal pr-4 hover:no-underline items-start gap-2 text-left"
        onClick={(e) => {
          if (isEditing) e.preventDefault();
        }}
      >
        <Link
          to={question.authorUsername ? `/u/${question.authorUsername}` : "#"}
          className="mr-3 shrink-0 mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <UserAvatar
            src={author?.avatar}
            name={question.authorUsername || "Anonymous"}
            className="size-7"
          />
        </Link>
        <div className="flex-1 text-left min-w-0 mr-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {question.authorUsername || "Anonymous"}
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {question.timeCreated &&
                formatRelativeTime(new Date(question.timeCreated))}
            </span>
          </div>
          {isEditing ? (
            <div
              className="mt-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
            >
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[80px] bg-background mb-2"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(question.content);
                  }}
                  disabled={isUpdatePending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdatePending}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-0.5">
              {question.content}
            </p>
          )}
        </div>

        {!isEditing && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2"
          >
            <UpvoteButton
              count={question.upvotes}
              isUpvoted={question.isUpvoted}
              onToggle={() => handleVote(questionId)}
              disabled={isVotePending}
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
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(question.content);
                    toast.success("Copied to clipboard");
                  }}
                >
                  <HugeiconsIcon
                    icon={Copy01Icon}
                    className="mr-2 size-4"
                  />
                  Copy Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert("Reported content")}>
                  <HugeiconsIcon icon={Alert01Icon} className="mr-2 size-4" />
                  Report
                </DropdownMenuItem>
                {user?.username === question.authorUsername && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
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
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        className="mr-2 size-4"
                      />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </AccordionTrigger>
      <AccordionContent>
        {replies ? (
          replies.map((reply, index) => (
            <ReplyItem
              key={reply.answer.uid ?? index}
              answerItem={reply}
              onDelete={() =>
                deleteReply({ questionId, replyId: reply.answer.uid ?? "" })
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
