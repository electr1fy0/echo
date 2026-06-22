import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router";
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
import { useAuthModal } from "@/hooks/use-auth-modal";
import { usePinQuestion, useUnpinQuestion, useUpdateQuestion, useExpressInterestViaDM } from "@/hooks/use-questions";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
  UserMultiple02Icon,
  ShoppingBag01Icon,
  Car01Icon,
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

function CountdownRing({ expiresAt, timeCreated, size = 28 }: { expiresAt: string; timeCreated: string; size?: number }) {
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
    const total = new Date(expiresAt).getTime() - new Date(timeCreated).getTime();
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
  const navigate = useNavigate();

  const { data: replies = [], isLoading: isRepliesLoading } = useRepliesQuery(
    questionId || undefined,
  );
  const { mutate: deleteReply } = useDeleteReply();
  const { mutate: handleVote, isPending: isVotePending } = useUpdateVote();
  const { data: user } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { mutate: updateQuestion, isPending: isUpdatePending } =
    useUpdateQuestion();
  const { mutate: pinQuestion, isPending: isPinPending } = usePinQuestion();
  const { mutate: unpinQuestion, isPending: isUnpinPending } = useUnpinQuestion();
  const { mutate: sendInterestDM, isPending: isDMPending } = useExpressInterestViaDM();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(question?.content ?? "");

  const [editedTradePrice, setEditedTradePrice] = useState(question?.tradePrice ? (question.tradePrice / 100).toString() : "");
  const [editedTradeCondition, setEditedTradeCondition] = useState(question?.tradeCondition ?? "Like New");
  const [editedTradeStatus, setEditedTradeStatus] = useState(question?.tradeStatus ?? "available");

  const [editedPartnerSlotsNeeded, setEditedPartnerSlotsNeeded] = useState(question?.partnerSlotsNeeded ?? 1);

  const [editedTaxiDeparture, setEditedTaxiDeparture] = useState(question?.taxiDeparture ?? "");
  const [editedTaxiDestination, setEditedTaxiDestination] = useState(question?.taxiDestination ?? "");
  const [editedTaxiDatetime, setEditedTaxiDatetime] = useState(question?.taxiDatetime ?? "");
  const [editedTaxiSeatsAvailable, setEditedTaxiSeatsAvailable] = useState(question?.taxiSeatsAvailable ?? 1);

  const [interestSent, setInterestSent] = useState(false);

  if (!question || !questionId) return null;
  const isPinned = !!question.isPinned;
  const isSolved = !!question.acceptedAnswerUid;
  const isExpiring = !!question.expiresAt;
  const canAccept = user?.username === question.authorUsername;

  function handleSave() {
    if (!questionId) return;
    if (!editedContent.trim()) return;
    updateQuestion(
      {
        questionId,
        content: editedContent,
        ...(question.postType === "trade" ? {
          tradePrice: editedTradePrice ? Math.round(Number(editedTradePrice) * 100) : undefined,
          tradeCondition: editedTradeCondition,
          tradeStatus: editedTradeStatus,
        } : {}),
        ...(question.postType === "partner" ? {
          partnerSlotsNeeded: Number(editedPartnerSlotsNeeded),
        } : {}),
        ...(question.postType === "taxi" ? {
          taxiDeparture: editedTaxiDeparture,
          taxiDestination: editedTaxiDestination,
          taxiDatetime: editedTaxiDatetime,
          taxiSeatsAvailable: Number(editedTaxiSeatsAvailable),
        } : {}),
      },
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
                {isExpiring && (
                  <span className="text-neutral-400 dark:text-neutral-500 leading-none inline-flex items-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
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
                className="space-y-3"
              >
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  className="min-h-[80px] bg-background"
                />

                {/* Marketplace edit sub-panel */}
                {question.postType === "trade" && (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden h-7 bg-background">
                      <span className="px-2 text-xs text-neutral-400 font-medium select-none border-r border-neutral-200 dark:border-neutral-700">₹</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="Price"
                        value={editedTradePrice}
                        onChange={(e) => setEditedTradePrice(e.target.value)}
                        className="w-20 h-7 text-xs px-2 bg-transparent text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <select
                      value={editedTradeCondition}
                      onChange={(e) => setEditedTradeCondition(e.target.value)}
                      className="h-7 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background px-2 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
                    >
                      <option value="New">Brand New</option>
                      <option value="Like New">Like New</option>
                      <option value="Used">Used</option>
                      <option value="PDF/Digital">Digital/PDF</option>
                    </select>
                    <select
                      value={editedTradeStatus}
                      onChange={(e) => setEditedTradeStatus(e.target.value)}
                      className="h-7 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background px-2 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
                    >
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                )}

                {/* Partners edit sub-panel */}
                {question.postType === "partner" && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 select-none">Slots</span>
                    <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setEditedPartnerSlotsNeeded(Math.max(1, editedPartnerSlotsNeeded - 1))}
                        className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium cursor-pointer select-none"
                      >−</button>
                      <span className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 border-x border-neutral-200 dark:border-neutral-700 select-none">
                        {editedPartnerSlotsNeeded}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditedPartnerSlotsNeeded(Math.min(10, editedPartnerSlotsNeeded + 1))}
                        className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium cursor-pointer select-none"
                      >+</button>
                    </div>
                  </div>
                )}

                {/* Taxi edit sub-panel */}
                {question.postType === "taxi" && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <input
                      type="text"
                      placeholder="Departure"
                      value={editedTaxiDeparture}
                      onChange={(e) => setEditedTaxiDeparture(e.target.value)}
                      className="w-24 text-xs h-7 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-2 text-neutral-700 dark:text-neutral-300"
                    />
                    <span className="text-neutral-400 text-xs">→</span>
                    <input
                      type="text"
                      placeholder="Destination"
                      value={editedTaxiDestination}
                      onChange={(e) => setEditedTaxiDestination(e.target.value)}
                      className="w-24 text-xs h-7 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-2 text-neutral-700 dark:text-neutral-300"
                    />
                    <DateTimePicker
                      value={editedTaxiDatetime}
                      onChange={setEditedTaxiDatetime}
                      placeholder="Pick date & time"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-neutral-400 select-none">Seats</span>
                      <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setEditedTaxiSeatsAvailable(Math.max(1, editedTaxiSeatsAvailable - 1))}
                          className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium cursor-pointer select-none"
                        >−</button>
                        <span className="w-6 h-6 flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 border-x border-neutral-200 dark:border-neutral-700 select-none">
                          {editedTaxiSeatsAvailable}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditedTaxiSeatsAvailable(Math.min(6, editedTaxiSeatsAvailable + 1))}
                          className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium cursor-pointer select-none"
                        >+</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(question.content);
                      setEditedTradePrice(question.tradePrice ? (question.tradePrice / 100).toString() : "");
                      setEditedTradeCondition(question.tradeCondition ?? "Like New");
                      setEditedTradeStatus(question.tradeStatus ?? "available");
                      setEditedPartnerSlotsNeeded(question.partnerSlotsNeeded ?? 1);
                      setEditedTaxiDeparture(question.taxiDeparture ?? "");
                      setEditedTaxiDestination(question.taxiDestination ?? "");
                      setEditedTaxiDatetime(question.taxiDatetime ?? "");
                      setEditedTaxiSeatsAvailable(question.taxiSeatsAvailable ?? 1);
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
              <>
                <MentionText
                  content={question.content}
                  className="block text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed"
                />

                          {/* Trade metadata + interest button */}
                {question.postType === "trade" && (
                  <div className="mt-3 p-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl w-full">
                    <div className="flex items-center gap-3 text-xs min-w-0 flex-wrap">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-blue-500 dark:text-blue-400 shrink-0">
                        <HugeiconsIcon icon={ShoppingBag01Icon} className="size-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Marketplace</span>
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-neutral-900 dark:text-neutral-100 font-bold text-sm">₹{question.tradePrice ? (question.tradePrice / 100).toFixed(0) : "0"}</span>
                          <span className="size-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                          <span className="font-semibold text-neutral-600 dark:text-neutral-300">{question.tradeCondition}</span>
                          <span className="size-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                          <span className={cn(
                            "flex items-center gap-1 font-semibold text-[11px]",
                            question.tradeStatus === "available"
                              ? "text-emerald-600 dark:text-emerald-450"
                              : "text-neutral-500 dark:text-neutral-450"
                          )}>
                            <span className={cn(
                              "size-1.5 rounded-full inline-block shrink-0",
                              question.tradeStatus === "available" ? "bg-emerald-500" : "bg-neutral-400"
                            )} />
                            {question.tradeStatus === "available" ? "Available" : "Sold"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {question.tradeStatus === "available" && user?.username !== question.authorUsername && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) { openAuthModal("signin"); return; }
                          sendInterestDM({
                            authorUsername: question.authorUsername!,
                            templateMessage: `Hey! I'm interested in: ${question.content.slice(0, 200)}`,
                          });
                          setInterestSent(true);
                          setTimeout(() => setInterestSent(false), 2000);
                        }}
                        disabled={isDMPending || interestSent}
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shadow-sm active:scale-95 w-full sm:w-auto justify-center",
                          interestSent
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
                        )}
                      >
                        {interestSent ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Sent
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={ShoppingBag01Icon} className="size-3.5" />
                            Interested
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Partner metadata + interest button */}
                {question.postType === "partner" && (
                  <div className="mt-3 p-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl w-full">
                    <div className="flex items-center gap-3 text-xs min-w-0">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-orange-500 dark:text-orange-400 shrink-0">
                        <HugeiconsIcon icon={UserMultiple02Icon} className="size-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Partner Finder</span>
                        <span className="text-neutral-700 dark:text-neutral-300 font-medium text-xs">
                          Looking for <strong className="text-neutral-900 dark:text-neutral-100 font-bold text-sm bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-200/50 dark:border-neutral-700/60">{question.partnerSlotsNeeded || 0}</strong>
                          {" "}{question.partnerSlotsNeeded === 1 ? "partner" : "partners"}
                        </span>
                      </div>
                    </div>
                    {user?.username !== question.authorUsername && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) { openAuthModal("signin"); return; }
                          sendInterestDM({
                            authorUsername: question.authorUsername!,
                            templateMessage: `Hey! I'd like to join your partner group. Are you still looking for members?`,
                          });
                          setInterestSent(true);
                          setTimeout(() => setInterestSent(false), 2000);
                        }}
                        disabled={isDMPending || interestSent}
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shadow-sm active:scale-95 w-full sm:w-auto justify-center",
                          interestSent
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
                        )}
                      >
                        {interestSent ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Sent
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={UserMultiple02Icon} className="size-3.5" />
                            Interested
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Taxi metadata + interest button */}
                {question.postType === "taxi" && (
                  <div className="mt-3 p-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl w-full">
                    <div className="flex items-start sm:items-center gap-3 text-xs min-w-0 flex-1 flex-col sm:flex-row">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-purple-500 dark:text-purple-400 shrink-0">
                        <HugeiconsIcon icon={Car01Icon} className="size-4" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 w-full">
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider block">Taxi Sharing</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm">
                            {question.taxiDeparture} <span className="text-purple-500 dark:text-purple-400 font-bold mx-0.5">→</span> {question.taxiDestination}
                          </span>
                          {question.taxiDatetime && (
                            <>
                              <span className="size-1 rounded-full bg-neutral-300 dark:bg-neutral-700 hidden sm:inline" />
                              <span className="text-neutral-500 dark:text-neutral-450 flex items-center gap-1">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3 text-neutral-400 dark:text-neutral-500">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {new Date(question.taxiDatetime).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </>
                          )}
                          {question.taxiSeatsAvailable && (
                            <>
                              <span className="size-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                              <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-450 font-semibold">
                                <HugeiconsIcon icon={UserMultiple02Icon} className="size-3 text-neutral-400 dark:text-neutral-500" />
                                {question.taxiSeatsAvailable} {question.taxiSeatsAvailable === 1 ? "seat" : "seats"} left
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {user?.username !== question.authorUsername && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) { openAuthModal("signin"); return; }
                          sendInterestDM({
                            authorUsername: question.authorUsername!,
                            templateMessage: `Hey! I'd like to join the trip from ${question.taxiDeparture || "?"} to ${question.taxiDestination || "?"}. Is there still space?`,
                          });
                          setInterestSent(true);
                          setTimeout(() => setInterestSent(false), 2000);
                        }}
                        disabled={isDMPending || interestSent}
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shadow-sm sm:self-center w-full sm:w-auto justify-center active:scale-95",
                          interestSent
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
                        )}
                      >
                        {interestSent ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Sent
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={Car01Icon} className="size-3.5" />
                            Join
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </>
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
            {replies.slice(0, 5).map((reply, index) => (
              <ReplyItem
                key={reply.answer.uid ?? index}
                answerItem={reply}
                canAccept={canAccept}
                onDelete={() =>
                  deleteReply({ questionId, replyId: reply.answer.uid ?? "" })
                }
              />
            ))}
            <Link
              to={`/q/${questionId}`}
              className="ml-10 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors block pt-2 pb-1"
              onClick={(e) => e.stopPropagation()}
            >
              View full thread {replies.length > 5 && `(${replies.length} replies)`}
            </Link>
          </>
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
