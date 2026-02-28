import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  accordionTriggerStyle,
} from "@/components/ui/accordion";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
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
import { usePinQuestion, useUnpinQuestion, useUpdateQuestion } from "@/hooks/use-questions";
import type { QuestionItem } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  Delete02Icon,
  PencilEdit02Icon,
  Copy01Icon,
  Alert01Icon,
  Pin02Icon,
  PinOffIcon,
} from "@hugeicons/core-free-icons";
import { UpvoteButton } from "../upvote-button";
import { ReplyItem } from "./reply-item";
import { ReplyForm } from "./reply-form";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeTime } from "@/lib/format-time";
import { toast } from "@/lib/toast";
import { MentionText } from "@/components/mentions/mention-text";

type QuestionItemProps = {
  questionItem: QuestionItem;
  onDelete: (id: string) => void;
  showChamberName?: boolean;
  canPin?: boolean;
};

import { QuestionListSkeleton } from "./question-skeleton";

const TriggerWrapper = ({
  children,
  isEditing,
}: {
  children: React.ReactNode;
  isEditing: boolean;
}) => {
  if (isEditing) {
    return (
      <div className="flex">
        <div
          className={cn(
            accordionTriggerStyle,
            "font-normal pt-3 pb-4 pr-4 hover:no-underline items-start gap-3 text-left w-full cursor-default hover:bg-transparent dark:hover:bg-transparent active:scale-100",
          )}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <AccordionTrigger className="font-normal pt-3 pb-4 pr-4 hover:no-underline items-start gap-3 text-left">
      {children}
    </AccordionTrigger>
  );
};

export function QuestionItem({
  questionItem,
  onDelete,
  showChamberName,
  canPin,
}: QuestionItemProps) {
  const question = questionItem?.question;
  const author = questionItem?.author ?? null;
  const questionId = question?.uid;

  const { data: replies = [], isLoading: isRepliesLoading } = useRepliesQuery(
    questionId || undefined,
  );
  const { mutate: deleteReply } = useDeleteReply();
  const { mutate: handleVote, isPending: isVotePending } = useUpdateVote();
  const { data: user } = useAuth();
  const { mutate: updateQuestion, isPending: isUpdatePending } =
    useUpdateQuestion();
  const { mutate: pinQuestion, isPending: isPinPending } = usePinQuestion();
  const { mutate: unpinQuestion, isPending: isUnpinPending } = useUnpinQuestion();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(question?.content ?? "");

  if (!question || !questionId) return null;
  const isPinned = !!question.isPinned;
  const isSolved = !!question.acceptedAnswerUid;
  const canAccept = user?.username === question.authorUsername;

  function handleSave() {
    if (!questionId) return;
    if (!editedContent.trim()) return;
    updateQuestion(
      { questionId, content: editedContent },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  }

  return (
    <AccordionItem value={questionId} className="w-full">
      <TriggerWrapper isEditing={isEditing}>
        <div className="flex items-start gap-3 w-full">
          <Link
            to={
              question.authorUsername
                ? `/u/${question.authorUsername}`
                : "#"
            }
            className="shrink-0 mt-1"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <UserAvatar
              src={author?.avatar}
              name={question.authorUsername || "Anonymous"}
              className="size-7"
            />
          </Link>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex pt-1 items-center gap-2.5 flex-wrap min-w-0">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {question.authorUsername || "Anonymous"}
                </span>
                {showChamberName && question.chamberName && (
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    in {question.chamberName}
                  </span>
                )}
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {question.timeCreated &&
                    formatRelativeTime(new Date(question.timeCreated))}
                </span>
                {isPinned && (
                  <span className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded">
                    Pinned
                  </span>
                )}
                {isSolved && (
                  <span className="text-[10px] uppercase tracking-wide bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                    Solved
                  </span>
                )}
                {replies && replies.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <AvatarGroup className="h-3">
                      {Array.from(
                        new Set(replies.map((r) => r.answer.authorUsername)),
                      )
                        .slice(0, 3)
                        .map((username, i) => {
                          const reply = replies.find(
                            (r) => r.answer.authorUsername === username,
                          );
                          return (
                            <UserAvatar
                              key={username || i}
                              name={username || "Anonymous"}
                              src={reply?.author?.avatar}
                              className="size-3 ring-1 ring-background"
                            />
                          );
                        })}
                      {new Set(replies.map((r) => r.answer.authorUsername))
                        .size > 3 && (
                        <AvatarGroupCount className="size-4 text-[9px] border-none ring-1 ring-background">
                          +
                          {new Set(replies.map((r) => r.answer.authorUsername))
                            .size - 3}
                        </AvatarGroupCount>
                      )}
                    </AvatarGroup>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      {replies.length}{" "}
                      {replies.length === 1 ? "reply" : "replies"}
                    </span>
                  </div>
                )}
              </div>
              {!isEditing && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 shrink-0"
                >
                  <UpvoteButton
                    count={question.upvotes}
                    isUpvoted={question.isUpvoted}
                    onToggle={() => handleVote(questionId)}
                    isPending={isVotePending}
                    className="w-14 text-right h-7 px-2.5 transition-colors"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={(props) => (
                        <Button
                          {...props}
                          variant="ghost"
                          size="icon"
                          aria-label="More options"
                          className="h-7 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onClick?.(e);
                          }}
                        >
                          <HugeiconsIcon
                            icon={MoreHorizontalIcon}
                            className="size-5"
                          />
                        </Button>
                      )}
                    />
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
                      <DropdownMenuItem
                        onClick={() => alert("Reported content")}
                      >
                        <HugeiconsIcon
                          icon={Alert01Icon}
                          className="mr-2 size-4"
                        />
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
                      {canPin && (
                        <DropdownMenuItem
                          onClick={() =>
                            isPinned
                              ? unpinQuestion(questionId)
                              : pinQuestion(questionId)
                          }
                          disabled={isPinPending || isUnpinPending}
                        >
                          <HugeiconsIcon
                            icon={isPinned ? PinOffIcon : Pin02Icon}
                            className="mr-2 size-4"
                          />
                          {isPinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            {isEditing ? (
              <div
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
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
              <MentionText
                content={question.content}
                className="block text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed"
              />
            )}
          </div>
        </div>
      </TriggerWrapper>
      <AccordionContent>
        {isRepliesLoading ? (
          <div className="pl-10">
            <QuestionListSkeleton count={2} />
          </div>
        ) : replies && replies.length > 0 ? (
          replies.map((reply, index) => (
            <ReplyItem
              key={reply.answer.uid ?? index}
              answerItem={reply}
              canAccept={canAccept}
              onDelete={() =>
                deleteReply({ questionId, replyId: reply.answer.uid ?? "" })
              }
            />
          ))
        ) : (
          <div className="text-sm ml-10 text-neutral-500">
            No replies. Be the first to answer
          </div>
        )}
        <ReplyForm questionId={questionId} />
      </AccordionContent>
    </AccordionItem>
  );
}
