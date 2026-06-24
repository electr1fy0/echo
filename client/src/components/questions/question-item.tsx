import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router";
import {
  Calendar,
  Link as LinkIcon,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  MapPin,
  IndianRupee,
  Route,
  Tag,
  Download,
} from "lucide-react";
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
  ChartUpIcon,
} from "@hugeicons/core-free-icons";
import { UpvoteButton } from "../upvote-button";
import { ThreadedReplies } from "./threaded-replies";
import { ReplyForm } from "./reply-form";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserPreviewCard } from "@/components/ui/user-preview-card";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
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
import { EmptyState } from "@/components/ui/dashed-empty-state";

type QuestionItemProps = {
  questionItem: QuestionItem;
  onDelete: (id: string) => void;
  showChamberName?: boolean;
  canPin?: boolean;
};

import { QuestionListSkeleton } from "./question-skeleton";
import { PostAnalytics } from "@/components/analytics/post-analytics";

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

const TriggerWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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

  const [interestSent, setInterestSent] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  if (!question || !questionId) return null;
  const isPinned = !!question.isPinned;
  const isSolved = !!question.acceptedAnswerUid;
  const isExpiring = !!question.expiresAt;

  return (
    <AccordionItem
      value={questionId}
      className="w-full border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
    >
      <TriggerWrapper>
        <div className="flex items-start gap-3 w-full">
          {(() => {
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
          })()}
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
                      onClick={() => {
                        const url = `${window.location.origin}/q/${questionId}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link copied to clipboard");
                      }}
                    >
                      <HugeiconsIcon
                        icon={Share01Icon}
                        className="mr-2 size-4"
                      />
                      Share
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
                        <DropdownMenuItem
                          onClick={() => setShowAnalytics(true)}
                        >
                          <HugeiconsIcon
                            icon={ChartUpIcon}
                            className="mr-2 size-4"
                          />
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditModal(question)}>
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
                  />
                )}

                {/* Dynamic custom fields metadata card */}
                {question.customFields &&
                  Object.keys(question.customFields).filter(
                    (k) => !k.startsWith("_"),
                  ).length > 0 &&
                  (() => {
                    const customFields = question.customFields || {};
                    const entries = Object.entries(customFields).filter(
                      ([k]) => !k.startsWith("_"),
                    );

                    // Helper to resolve field label, type, disabled state, and whether it's an image or file
                    const getFieldInfo = (key: string, val: any) => {
                      const fieldDef = question.channelSchema?.find(
                        (f: any) => f.id === key,
                      );
                      const label =
                        customFields._fieldLabels?.[key] ||
                        fieldDef?.label ||
                        key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase());
                      const type =
                        customFields._fieldTypes?.[key] || fieldDef?.type;
                      const isImage =
                        type === "image" ||
                        (val &&
                          typeof val === "object" &&
                          "url" in val &&
                          (val.type?.startsWith("image/") ||
                            [
                              "jpg",
                              "jpeg",
                              "png",
                              "gif",
                              "webp",
                              "svg",
                            ].includes(
                              val.name?.split(".").pop()?.toLowerCase() || "",
                            )));
                      const isFile =
                        !isImage &&
                        val &&
                        typeof val === "object" &&
                        "url" in val &&
                        "name" in val;
                      return {
                        label,
                        type,
                        isImage,
                        isFile,
                        disabled: fieldDef?.disabled === true,
                      };
                    };

                    const hasMetadata = entries.some(([key, val]) => {
                      const info = getFieldInfo(key, val);
                      return (
                        !info.isImage &&
                        !info.isFile &&
                        info.type !== "poll" &&
                        !key.startsWith("poll")
                      );
                    });
                    const hasImages = entries.some(
                      ([key, val]) => getFieldInfo(key, val).isImage,
                    );
                    const hasFiles = entries.some(
                      ([key, val]) => getFieldInfo(key, val).isFile,
                    );

                    if (!hasMetadata && !hasImages && !hasFiles) return null;

                    return (
                      <div className="mt-3 p-3.5 flex flex-col gap-3.5 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl w-full">
                        {/* Metadata fields list (excluding files/images) */}
                        {hasMetadata && (
                          <div className="flex flex-col gap-1.5 min-w-0 w-full">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              {entries.map(([key, val]) => {
                                if (
                                  val === undefined ||
                                  val === null ||
                                  val === ""
                                )
                                  return null;
                                const info = getFieldInfo(key, val);
                                if (
                                  info.isImage ||
                                  info.isFile ||
                                  info.type === "poll" ||
                                  key.startsWith("poll")
                                )
                                  return null;

                                // Format currency type (Price)
                                if (
                                  info.type === "currency" ||
                                  key === "price" ||
                                  key === "min_order"
                                ) {
                                  const showLabel = ![
                                    "price",
                                    "cost",
                                    "rate",
                                    "amount",
                                  ].includes(info.label.toLowerCase().trim());
                                  return (
                                    <div
                                      key={key}
                                      className={cn(
                                        "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm text-xs font-bold text-neutral-850 dark:text-neutral-100",
                                        info.disabled &&
                                          "opacity-50 line-through",
                                      )}
                                    >
                                      <IndianRupee className="size-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                                      <span>
                                        {showLabel && (
                                          <span className="text-neutral-500 dark:text-neutral-400 font-medium mr-1">
                                            {info.label}:
                                          </span>
                                        )}
                                        {Number(val).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  );
                                }

                                // Format date-time type
                                if (
                                  info.type === "datetime" ||
                                  key === "datetime" ||
                                  key === "deadline"
                                ) {
                                  let displayDate = val;
                                  try {
                                    displayDate = new Date(val).toLocaleString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "numeric",
                                        minute: "2-digit",
                                        hour12: true,
                                      },
                                    );
                                  } catch {}
                                  const showLabel = ![
                                    "date-time",
                                    "datetime",
                                    "date",
                                    "time",
                                    "deadline",
                                    "departure time",
                                  ].includes(info.label.toLowerCase().trim());
                                  return (
                                    <div
                                      key={key}
                                      className={cn(
                                        "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm text-xs font-bold text-neutral-850 dark:text-neutral-100",
                                        info.disabled &&
                                          "opacity-50 line-through",
                                      )}
                                    >
                                      <Calendar className="size-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                                      <span>
                                        {showLabel && (
                                          <span className="text-neutral-500 dark:text-neutral-400 font-medium mr-1">
                                            {info.label}:
                                          </span>
                                        )}
                                        {displayDate}
                                      </span>
                                    </div>
                                  );
                                }

                                // Format location type
                                if (
                                  info.type === "location" ||
                                  key === "location"
                                ) {
                                  const showLabel = !["location"].includes(
                                    info.label.toLowerCase().trim(),
                                  );
                                  return (
                                    <div
                                      key={key}
                                      className={cn(
                                        "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm text-xs font-bold text-neutral-850 dark:text-neutral-100",
                                        info.disabled &&
                                          "opacity-50 line-through",
                                      )}
                                    >
                                      <MapPin className="size-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                                      <span>
                                        {showLabel && (
                                          <span className="text-neutral-500 dark:text-neutral-400 font-medium mr-1">
                                            {info.label}:
                                          </span>
                                        )}
                                        {String(val)}
                                      </span>
                                    </div>
                                  );
                                }

                                // Format Route type
                                if (
                                  info.type === "source_destination" ||
                                  key === "route"
                                ) {
                                  const routeVal = val as
                                    | { source: string; destination: string }
                                    | undefined;
                                  if (
                                    !routeVal?.source &&
                                    !routeVal?.destination
                                  )
                                    return null;
                                  return (
                                    <div
                                      key={key}
                                      className={cn(
                                        "inline-flex items-center gap-2 h-8 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm text-xs font-bold text-neutral-850 dark:text-neutral-100",
                                        info.disabled &&
                                          "opacity-50 line-through",
                                      )}
                                    >
                                      <Route className="size-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                                      <span className="truncate">
                                        {routeVal.source || "Anywhere"}
                                      </span>
                                      <span className="text-neutral-400 dark:text-neutral-600 font-medium font-sans">
                                        →
                                      </span>
                                      <span className="truncate">
                                        {routeVal.destination || "Anywhere"}
                                      </span>
                                    </div>
                                  );
                                }

                                // Format key_value type
                                if (
                                  info.type === "key_value" ||
                                  (val &&
                                    typeof val === "object" &&
                                    "key" in val &&
                                    "value" in val)
                                ) {
                                  const kvVal = val as
                                    | { key: string; value: string }
                                    | undefined;
                                  if (!kvVal?.key && !kvVal?.value) return null;
                                  return (
                                    <div
                                      key={key}
                                      className={cn(
                                        "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm text-xs font-bold text-neutral-850 dark:text-neutral-100",
                                        info.disabled &&
                                          "opacity-50 line-through",
                                      )}
                                    >
                                      <Tag className="size-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                                      <span>
                                        <span className="text-neutral-500 dark:text-neutral-400 font-medium mr-1">
                                          {kvVal.key || "Property"}:
                                        </span>
                                        {kvVal.value || "Any"}
                                      </span>
                                    </div>
                                  );
                                }

                                // Format button type
                                if (
                                  info.type === "button" ||
                                  (val &&
                                    typeof val === "object" &&
                                    "label" in val &&
                                    "template" in val)
                                ) {
                                  const btnVal = val as
                                    | { label: string; template: string }
                                    | undefined;
                                  if (!btnVal?.label) return null;

                                  const isSelf =
                                    user?.username === question.authorUsername;
                                  return (
                                    <Button
                                      key={key}
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      disabled={isSelf || isDMPending}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!user) {
                                          openAuthModal("signin");
                                          return;
                                        }
                                        sendInterestDM({
                                          authorUsername:
                                            question.authorUsername!,
                                          templateMessage:
                                            btnVal.template ||
                                            `Hey, I'm interested in your post!`,
                                        });
                                        toast.success("Interest sent via DM!");
                                      }}
                                      className="cursor-pointer text-xs font-semibold"
                                    >
                                      {btnVal.label}
                                    </Button>
                                  );
                                }

                                // Format url type
                                if (
                                  info.type === "url" ||
                                  (typeof val === "string" &&
                                    val.startsWith("http"))
                                ) {
                                  const showLabel = ![
                                    "link",
                                    "url",
                                    "website",
                                  ].includes(info.label.toLowerCase().trim());
                                  return (
                                    <a
                                      key={key}
                                      href={val}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white hover:bg-neutral-50 dark:bg-neutral-900/50 dark:hover:bg-neutral-900 shadow-sm text-xs text-[var(--brand)] font-bold transition-all",
                                        info.disabled &&
                                          "opacity-50 line-through",
                                      )}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <LinkIcon className="size-3.5 text-[var(--brand)] shrink-0" />
                                      <span className="hover:underline">
                                        {showLabel ? info.label : "Link"}
                                      </span>
                                    </a>
                                  );
                                }

                                return (
                                  <div
                                    key={key}
                                    className={cn(
                                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm text-xs font-bold text-neutral-850 dark:text-neutral-100",
                                      info.disabled && "opacity-50",
                                    )}
                                  >
                                    <FileText className="size-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                                    <span>
                                      {info.label}: {String(val)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Images Section */}
                        {hasImages && (
                          <div className="flex flex-col gap-1.5 w-full">
                            <div className="flex gap-3 overflow-x-auto scrollbar-none py-0.5">
                              {entries.map(([key, val]) => {
                                if (
                                  val === undefined ||
                                  val === null ||
                                  val === ""
                                )
                                  return null;

                                const info = getFieldInfo(key, val);
                                if (!info.isImage) return null;

                                const file = val as
                                  | { url: string; name: string }
                                  | string;
                                const imageUrl =
                                  typeof file === "string" ? file : file.url;
                                const imageName =
                                  typeof file === "string"
                                    ? info.label
                                    : file.name;

                                return (
                                  <div
                                    key={key}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(imageUrl, "_blank");
                                    }}
                                    className={cn(
                                      "relative group cursor-zoom-in shrink-0 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-805 shadow-sm bg-neutral-100 dark:bg-neutral-900 hover:scale-[1.02] active:scale-[0.98] transition-all",
                                      info.disabled && "opacity-60",
                                    )}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={imageName}
                                      className="size-20 sm:size-24 object-cover rounded-2xl"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[9px] font-semibold text-white/95 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                      {info.label}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Files List Section */}
                        {hasFiles && (
                          <div className="flex flex-col gap-1.5 w-full">
                            <div className="space-y-2">
                              {entries.map(([key, val]) => {
                                if (
                                  val === undefined ||
                                  val === null ||
                                  val === ""
                                )
                                  return null;

                                const info = getFieldInfo(key, val);
                                if (!info.isFile) return null;

                                const file = val as {
                                  url: string;
                                  name: string;
                                  size: number;
                                  type: string;
                                };

                                let FileIconComp = FileText;
                                const ext = file.name
                                  ?.split(".")
                                  .pop()
                                  ?.toLowerCase();
                                if (
                                  file.type?.includes("zip") ||
                                  file.type?.includes("tar") ||
                                  ext === "zip" ||
                                  ext === "rar"
                                )
                                  FileIconComp = FileArchive;
                                else if (
                                  file.type?.includes("sheet") ||
                                  file.type?.includes("excel") ||
                                  ext === "xls" ||
                                  ext === "xlsx"
                                )
                                  FileIconComp = FileSpreadsheet;
                                else FileIconComp = FileIcon;

                                return (
                                  <div
                                    key={key}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(file.url, "_blank");
                                    }}
                                    className={cn(
                                      "flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800/80 bg-background/50 hover:bg-neutral-100/50 dark:hover:bg-neutral-950/40 rounded-2xl cursor-pointer transition-all duration-150 group",
                                      info.disabled && "opacity-75",
                                    )}
                                  >
                                    <div className="flex items-center gap-3 min-w-0 max-w-[80%]">
                                      <FileIconComp className="size-5 shrink-0 text-neutral-500 group-hover:text-[var(--brand)] transition-colors group-hover:scale-105 transition-transform" />
                                      <div className="flex flex-col min-w-0">
                                        <span
                                          className={cn(
                                            "text-xs font-semibold text-neutral-850 dark:text-neutral-100 truncate group-hover:text-[var(--brand)] transition-colors",
                                            info.disabled &&
                                              "line-through text-neutral-500",
                                          )}
                                        >
                                          {file.name}{" "}
                                          {info.disabled && (
                                            <span className="text-[9px] font-normal no-underline opacity-70 ml-1">
                                              (disabled)
                                            </span>
                                          )}
                                        </span>
                                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                                          {file.size
                                            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                                            : "Unknown Size"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-center size-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background hover:bg-neutral-100 dark:hover:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 shrink-0">
                                      <Download className="size-4" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* Quick action DM button */}
                {user?.username !== question.authorUsername && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        openAuthModal("signin");
                        return;
                      }

                      // Custom DM content template based on fields
                      const customFields = question.customFields || {};
                      let dmMsg = `Hey! I'm interested in your post: "${question.content.slice(0, 100)}..."`;
                      if (customFields.departure && customFields.destination) {
                        dmMsg = `Hey! I'd like to join your carpool from ${customFields.departure} to ${customFields.destination}. Is there still space?`;
                      } else if (customFields.price) {
                        dmMsg = `Hey! I'm interested in buying your item for ₹${customFields.price}. Is it still available?`;
                      } else if (customFields.slots) {
                        dmMsg = `Hey! I'm interested in joining your group. Let me know if you still have space!`;
                      } else if (customFields.item) {
                        const itemType =
                          customFields.type === "Found" ? "found" : "lost";
                        dmMsg = `Hey! I saw your post about the ${itemType} item: "${customFields.item}". I have some info / would like to connect!`;
                      } else if (customFields.difficulty) {
                        dmMsg = `Hey! I'm interested in joining your ${customFields.difficulty} LeetCode prep group.`;
                      } else if (customFields.pickup) {
                        dmMsg = `Hey! I'm interested in joining the food group-buy for ${customFields.pickup}.`;
                      } else if (customFields.file) {
                        const fileObj = customFields.file as { name: string };
                        dmMsg = `Hey! I saw your uploaded resource "${fileObj.name || "file"}" in the chamber. Had a quick question about it!`;
                      }

                      sendInterestDM({
                        authorUsername: question.authorUsername!,
                        templateMessage: dmMsg,
                      });
                      setInterestSent(true);
                      setTimeout(() => setInterestSent(false), 2000);
                    }}
                    disabled={isDMPending || interestSent}
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 h-8.5 px-4 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer shadow-sm active:scale-95 w-full sm:w-auto justify-center self-end",
                      interestSent
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200",
                    )}
                  >
                    {interestSent ? (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-3.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Sent
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon
                          icon={Share01Icon}
                          className="size-3.5 rotate-180"
                        />
                        Interested
                      </>
                    )}
                  </button>
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
          <>
            <div className="pl-10">
              <ThreadedReplies
                replies={replies.slice(0, 5)}
                questionId={questionId}
                authorUsername={question.authorUsername}
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

      {showAnalytics && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAnalytics(false)}
        >
          <div
            className="bg-background rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-sm mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <PostAnalytics
              postUid={questionId}
              onClose={() => setShowAnalytics(false)}
            />
          </div>
        </div>
      )}

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
