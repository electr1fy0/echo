import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { useRepliesQuery, useDeleteReply } from "@/hooks/use-replies";
import { useUpdateVote } from "@/hooks/use-upvote";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useEditPostModal } from "@/hooks/use-edit-post-modal";
import {
  usePinQuestion,
  useUnpinQuestion,
  useExpressInterestViaDM,
} from "@/hooks/use-questions";
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
  BookOpen01Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { UpvoteButton } from "../upvote-button";
import { ThreadedReplies } from "./threaded-replies";
import { ReplyForm } from "./reply-form";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserPreviewCard } from "@/components/ui/user-preview-card";
import { formatDistanceToNowStrict } from "date-fns";
import { toastManager } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { PostContent } from "@/components/post-content";
import { PollVoter } from "@/components/poll-voter";
import { PostCustomFields } from "@/components/questions/post-custom-fields";
import { EmptyState } from "@/components/ui/dashed-empty-state";

type QuestionItemProps = {
  questionItem: QuestionItem;
  onDelete: (id: string) => void;
  showChamberName?: boolean;
  canPin?: boolean;
};

import { QuestionListSkeleton } from "./question-skeleton";

function CountdownRing({
  expiresAt,
  timeCreated,
  size = 28,
}: {
  expiresAt: string;
  timeCreated: string;
  size?: number;
}) {
  const ringSize = size + 4;
  const stroke = 1.5;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const [progress, setProgress] = useState(() => {
    const total =
      new Date(expiresAt).getTime() - new Date(timeCreated).getTime();
    const elapsed = Date.now() - new Date(timeCreated).getTime();
    return Math.max(0, Math.min(1, 1 - elapsed / total));
  });

  useEffect(() => {
    const total =
      new Date(expiresAt).getTime() - new Date(timeCreated).getTime();
    const tick = () => {
      const elapsed = Date.now() - new Date(timeCreated).getTime();
      setProgress(Math.max(0, Math.min(1, 1 - elapsed / total)));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, timeCreated]);

  const offset = circumference * (1 - progress);

  return (
    <svg
      viewBox={`0 0 ${ringSize} ${ringSize}`}
      className="absolute -inset-0.5 -rotate-90"
      width={ringSize}
      height={ringSize}
    >
      <circle
        cx={ringSize / 2}
        cy={ringSize / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        opacity={0.15}
      />
      <circle
        cx={ringSize / 2}
        cy={ringSize / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-500 ease-linear text-neutral-500 dark:text-neutral-400"
      />
    </svg>
  );
}

const TriggerWrapper = ({ children }: { children: React.ReactNode }) => {
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
  const author = (questionItem as QuestionItem | undefined)?.author ?? null;
  const questionId = question?.uid;
  const navigate = useNavigate();

  const { data: replies = [], isLoading: isRepliesLoading } = useRepliesQuery(
    questionId || undefined,
  );
  const { mutate: deleteReply } = useDeleteReply();
  const { mutate: handleVote, isPending: isVotePending } = useUpdateVote();
  const { data: user } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { open: openEditModal } = useEditPostModal();
  const { mutate: pinQuestion, isPending: isPinPending } = usePinQuestion();
  const { mutate: unpinQuestion, isPending: isUnpinPending } =
    useUnpinQuestion();
  const { mutate: sendInterestDM, isPending: isDMPending } =
    useExpressInterestViaDM();

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  if (!question || !questionId) return null;
  const isPinned = !!question.isPinned;
  const isSolved = !!question.acceptedAnswerUid;
  const isExpiring = !!question.expiresAt;
  const isAnonymous = !!question.isAnonymous;

  return (
    <AccordionItem
      value={questionId}
      className="w-full border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
    >
      <TriggerWrapper>
        <div className="flex items-start gap-3 w-full">
          {isAnonymous ? (
            <div className="shrink-0 mt-1 relative">
              <UserAvatar src={undefined} name="Anonymous" className="size-7" />
              {question.expiresAt && question.timeCreated && (
                <CountdownRing
                  expiresAt={question.expiresAt as string}
                  timeCreated={String(question.timeCreated)}
                  size={28}
                />
              )}
            </div>
          ) : (
            (() => {
              const avatarLink = (
                <Link
                  to={
                    question.authorUsername
                      ? `/u/${question.authorUsername}`
                      : "#"
                  }
                  className="shrink-0 mt-1 relative"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <UserAvatar
                    src={author?.avatar}
                    name={question.authorUsername || "Anonymous"}
                    className="size-7"
                  />
                  {question.expiresAt && question.timeCreated && (
                    <CountdownRing
                      expiresAt={question.expiresAt as string}
                      timeCreated={String(question.timeCreated)}
                      size={28}
                    />
                  )}
                </Link>
              );
              return author ? (
                <UserPreviewCard user={author}>{avatarLink}</UserPreviewCard>
              ) : (
                avatarLink
              );
            })()
          )}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex pt-1 items-center gap-2.5 flex-wrap min-w-0">
                {isAnonymous ? (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Anonymous
                  </span>
                ) : (
                  <Link
                    to={`/u/${question.authorUsername}`}
                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  >
                    {question.authorUsername || "Anonymous"}
                  </Link>
                )}
                {showChamberName && question.chamberName && (
                  <Link
                    to={`/chambers/${question.chamberUid}`}
                    className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  >
                    in {question.chamberName}
                  </Link>
                )}
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {question.timeCreated &&
                    formatDistanceToNowStrict(new Date(question.timeCreated), {
                      addSuffix: true,
                    })}
                </span>
                {isExpiring && (
                  <span className="text-neutral-400 dark:text-neutral-500 leading-none inline-flex items-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-3.5"
                    >
                      <path d="M9 10h.01" />
                      <path d="M15 10h.01" />
                      <path d="M12 2a8 8 0 0 0-8 8v6a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-6a8 8 0 0 0-8-8z" />
                      <path d="M12 22v-4" />
                      <path d="M9 18s.5 1 3 1 3-1 3-1" />
                    </svg>
                  </span>
                )}
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
                        new Set(
                          replies.map((r) =>
                            r.answer.isAnonymous
                              ? "Anonymous"
                              : r.answer.authorUsername,
                          ),
                        ),
                      )
                        .slice(0, 3)
                        .map((username, i) => {
                          const reply = replies.find(
                            (r) =>
                              (r.answer.isAnonymous
                                ? "Anonymous"
                                : r.answer.authorUsername) === username,
                          );
                          const isAnonReply = reply?.answer.isAnonymous;
                          return (
                            <UserAvatar
                              key={username || i}
                              name={isAnonReply ? "Anonymous" : username}
                              src={
                                isAnonReply ? undefined : reply?.author?.avatar
                              }
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
                      {question.repliesCount ?? replies.length}{" "}
                      {(question.repliesCount ?? replies.length) === 1
                        ? "reply"
                        : "replies"}
                    </span>
                  </div>
                )}
              </div>
              <div
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex items-center gap-2 shrink-0"
              >
                <UpvoteButton
                  count={question.upvotes}
                  isUpvoted={question.isUpvoted}
                  onToggle={() => {
                    if (!user) {
                      openAuthModal("signin");
                    } else {
                      handleVote(questionId);
                    }
                  }}
                  isPending={isVotePending}
                  className="w-14 text-right h-7 px-2.5 transition-colors"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={(props) => (
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon-xs"
                        aria-label="More options"
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
                      onClick={() => navigate(`/q/${questionId}`)}
                    >
                      <HugeiconsIcon
                        icon={BookOpen01Icon}
                        className="mr-2 size-4"
                      />
                      View Thread
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(question.content);
                        toastManager.add({
                          title: "Copied to clipboard",
                          type: "success",
                        });
                      }}
                    >
                      <HugeiconsIcon
                        icon={Copy01Icon}
                        className="mr-2 size-4"
                      />
                      Copy Text
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const url = `${window.location.origin}/q/${questionId}`;
                        navigator.clipboard.writeText(url);
                        toastManager.add({
                          title: "Link copied to clipboard",
                          type: "success",
                        });
                      }}
                    >
                      <HugeiconsIcon
                        icon={Share01Icon}
                        className="mr-2 size-4"
                      />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => alert("Reported content")}>
                      <HugeiconsIcon
                        icon={Alert01Icon}
                        className="mr-2 size-4"
                      />
                      Report
                    </DropdownMenuItem>
                    {user?.username === question.authorUsername && (
                      <>
                        <DropdownMenuItem
                          onClick={() => openEditModal(question)}
                        >
                          <HugeiconsIcon
                            icon={PencilEdit02Icon}
                            className="mr-2 size-4"
                          />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setShowDeleteAlert(true)}
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
            </div>
            <PostContent
              content={question.content}
              className="block text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed"
            />

            {/* Poll voter */}
            {question.postType === "poll" && question.pollUid && (
              <PollVoter
                questionId={questionId}
                pollUid={question.pollUid}
                pollQuestion={question.pollQuestion ?? ""}
                pollOptions={question.pollOptions ?? []}
                pollVotes={question.pollVotes ?? []}
                userPollVote={question.userPollVote ?? null}
                isPollClosed={question.pollIsClosed ?? false}
                pollExpiresAt={question.pollExpiresAt ?? null}
              />
            )}

            {/* Dynamic custom fields metadata card */}
            <PostCustomFields
              customFields={question.customFields}
              channelSchema={question.channelSchema}
              authorUsername={question.authorUsername}
              user={user}
              isDMPending={isDMPending}
              sendInterestDM={sendInterestDM}
              openAuthModal={openAuthModal}
            />
          </div>
        </div>
      </TriggerWrapper>
      <AccordionContent>
        {isRepliesLoading ? (
          <div className="pl-10">
            <QuestionListSkeleton count={2} />
          </div>
        ) : replies && replies.length > 0 ? (
          <>
            <div className="pl-10">
              <ThreadedReplies
                replies={replies.slice(0, 5)}
                questionId={questionId}
                authorUsername={question.authorUsername}
                isAnonymousPost={isAnonymous}
                onDelete={(replyId) => deleteReply({ questionId, replyId })}
              />
            </div>
            <Link
              to={`/q/${questionId}`}
              className="ml-10 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors block pt-2 pb-1"
              onClick={(e) => e.stopPropagation()}
            >
              View full thread{" "}
              {replies.length > 5 && `(${replies.length} replies)`}
            </Link>
          </>
        ) : (
          <div className="ml-6">
            <EmptyState
              title="No replies yet"
              description="Be the first to answer"
              className="py-6"
            />
          </div>
        )}
        <ReplyForm questionId={questionId} />
      </AccordionContent>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogPopup portalProps={{}}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>
              Cancel
            </AlertDialogClose>
            <AlertDialogClose
              render={<Button variant="destructive" />}
              onClick={() => onDelete(questionId)}
            >
              Delete
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </AccordionItem>
  );
}
