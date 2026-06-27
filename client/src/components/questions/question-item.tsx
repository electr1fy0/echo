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
import { cn } from "@/lib/utils";
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
import {
  useBookmarkPost,
  useUnbookmarkPost,
} from "@/hooks/use-bookmarks";
import { useReportContent } from "@/hooks/use-reports";
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
  Analytics02Icon,
} from "@hugeicons/core-free-icons";
import { BookmarkIcon } from "lucide-react";
import { UpvoteButton } from "../upvote-button";
import { ThreadedReplies } from "./threaded-replies";
import { ReplyForm } from "./reply-form";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserPreviewCard } from "@/components/ui/user-preview-card";
import { formatTimeAgo } from "@/lib/utils";
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
import { PostAnalytics } from "@/components/analytics/post-analytics";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type QuestionItemProps = {
  questionItem: QuestionItem;
  onDelete: (id: string) => void;
  showChamberName?: boolean;
  canPin?: boolean;
};

import { QuestionListSkeleton } from "./question-skeleton";

let sharedTicker: ReturnType<typeof setInterval> | null = null;
const tickCallbacks = new Set<() => void>();

function startSharedTicker() {
  if (sharedTicker) return;
  sharedTicker = setInterval(() => {
    tickCallbacks.forEach((cb) => cb());
  }, 1000);
}

function stopSharedTicker() {
  if (!sharedTicker) return;
  clearInterval(sharedTicker);
  sharedTicker = null;
}

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
    const total = new Date(expiresAt).getTime() - new Date(timeCreated).getTime();
    const elapsed = Date.now() - new Date(timeCreated).getTime();
    return Math.max(0, Math.min(1, 1 - elapsed / total));
  });

  useEffect(() => {
    const timeCreatedTime = new Date(timeCreated).getTime();
    const total = new Date(expiresAt).getTime() - timeCreatedTime;

    const cb = () => {
      const elapsed = Date.now() - timeCreatedTime;
      setProgress(Math.max(0, Math.min(1, 1 - elapsed / total)));
    };

    tickCallbacks.add(cb);
    startSharedTicker();

    return () => {
      tickCallbacks.delete(cb);
      if (tickCallbacks.size === 0) {
        stopSharedTicker();
      }
    };
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

const TriggerWrapper = ({ children, onExpand }: { children: React.ReactNode; onExpand?: () => void }) => {
  return (
    <AccordionTrigger
      className="font-normal pt-3 pb-4 pr-4 hover:no-underline items-start gap-3 text-left min-w-0"
      onPointerDown={onExpand}
    >
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
  const postUrlId = question?.slug || question?.uid;
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
  const { mutate: report } = useReportContent();
  const { mutate: bookmarkPost } = useBookmarkPost();
  const { mutate: unbookmarkPost } = useUnbookmarkPost();

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSaved, setIsSaved] = useState(!!question.isSaved);

  useEffect(() => {
    setIsSaved(!!question.isSaved);
  }, [question.isSaved]);

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
          {isAnonymous || author?.username === "[deleted]" ? (
            <div className="shrink-0 mt-1 relative">
              <UserAvatar
                src={undefined}
                name={author?.username === "[deleted]" ? "[deleted]" : "Anonymous"}
                className={cn("size-7", author?.username === "[deleted]" && "opacity-40")}
              />
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
            <div className="flex items-start sm:items-center justify-between gap-2">
              <div className="flex pt-1 items-center gap-2.5 flex-wrap min-w-0">
                {isAnonymous || question.authorUsername === "[deleted]" ? (
                  <span className={cn("text-xs", question.authorUsername === "[deleted]" ? "text-neutral-400 dark:text-neutral-500 italic" : "text-neutral-500 dark:text-neutral-400")}>
                    {question.authorUsername === "[deleted]" ? "[deleted]" : "Anonymous"}
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
                    to={`/chambers/${question.chamberSlug || question.chamberUid}`}
                    className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  >
                    in {question.chamberName}
                  </Link>
                )}
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
                <span className="flex items-center gap-2.5 flex-nowrap">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    {question.timeCreated && formatTimeAgo(question.timeCreated)}
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
                  {replies && replies.length > 0 ? (() => {
                    const uniqueAuthors = Array.from(
                      new Set(
                        replies.map((r) =>
                          r.answer.isAnonymous ? "Anonymous" : r.answer.authorUsername,
                        ),
                      ),
                    );
                    const uniqueCount = uniqueAuthors.length;
                    const topAuthors = uniqueAuthors.slice(0, 3);
                    return (
                      <div className="flex items-center gap-1.5 ml-1">
                        <AvatarGroup className="h-3">
                          {topAuthors.map((username, i) => {
                            const reply = replies.find(
                              (r) =>
                                (r.answer.isAnonymous ? "Anonymous" : r.answer.authorUsername) === username,
                            );
                            const isAnonReply = reply?.answer.isAnonymous;
                            return (
                              <UserAvatar
                                key={username || i}
                                name={isAnonReply ? "Anonymous" : username}
                                src={isAnonReply ? undefined : reply?.author?.avatar}
                                className="size-3 ring-1 ring-background"
                              />
                            );
                          })}
                          {uniqueCount > 3 && (
                            <AvatarGroupCount className="size-4 text-[9px] border-none ring-1 ring-background">
                              +{uniqueCount - 3}
                            </AvatarGroupCount>
                          )}
                        </AvatarGroup>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                          {question.repliesCount ?? replies.length}{" "}
                          {(question.repliesCount ?? replies.length) === 1 ? "reply" : "replies"}
                        </span>
                      </div>
                    );
                  })() : question.repliesCount ? (
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-1">
                      {question.repliesCount}{" "}
                      {question.repliesCount === 1 ? "reply" : "replies"}
                    </span>
                  ) : null}
                </span>
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
                      onClick={() => navigate(`/p/${postUrlId}`)}
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
                        const url = `${window.location.origin}/p/${postUrlId}`;
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
                    <DropdownMenuItem
                      onClick={() => {
                        if (!user) { openAuthModal("signin"); return; }
                        const newSaved = !isSaved;
                        setIsSaved(newSaved);
                        if (newSaved) {
                          bookmarkPost(questionId);
                          toastManager.add({ title: "Post saved", type: "success" });
                        } else {
                          unbookmarkPost(questionId);
                          toastManager.add({ title: "Post unsaved", type: "success" });
                        }
                      }}
                    >
                      <BookmarkIcon className="mr-2 size-4" />
                      {isSaved ? "Unsave" : "Save"}
                    </DropdownMenuItem>
<DropdownMenuItem onClick={() => report({ targetType: "post", targetUid: questionId })}>
  <HugeiconsIcon
    icon={Alert01Icon}
    className="mr-2 size-4"
  />
  Report
</DropdownMenuItem>
                    {user?.username === question.authorUsername && (
                      <>
                        <DropdownMenuItem
                          onClick={() => setShowAnalytics(true)}
                        >
                          <HugeiconsIcon
                            icon={Analytics02Icon}
                            className="mr-2 size-4"
                          />
                          Post Analytics
                        </DropdownMenuItem>
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
                canAccept={user?.username === question.authorUsername && !isAnonymous && question.acceptsAnswers !== false}
                onDelete={(replyId) => deleteReply({ questionId, replyId })}
              />
            </div>
            <Link
              to={`/p/${postUrlId}`}
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

      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="sm:max-w-[420px]" aria-label="Post Analytics">
          <PostAnalytics postUid={questionId} />
        </DialogContent>
      </Dialog>

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
