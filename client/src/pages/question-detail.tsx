import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  PencilEdit02Icon,
  Delete02Icon,
  UserMultiple02Icon,
  BubbleChatIcon,
} from "@hugeicons/core-free-icons";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useEditPostModal } from "@/hooks/use-edit-post-modal";
import {
  useQuestionQuery,
  useDeleteQuestion,
} from "@/hooks/use-questions";
import { useRepliesQuery, useDeleteReply } from "@/hooks/use-replies";
import { useUpdateVote } from "@/hooks/use-upvote";
import {
  useApplyToPartner,
  usePartnerApplicationsQuery,
  useUpdatePartnerApplicationStatus,
  useExpressInterestViaDM,
} from "@/hooks/use-questions";
import { PageTransition } from "@/components/page-transition";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDistanceToNowStrict } from "date-fns";
import { handleApiError } from "@/lib/api-error";
import { toastManager } from "@/components/ui/toast";
import { PostContent } from "@/components/post-content";
import { UpvoteButton } from "@/components/upvote-button";
import { ReplyForm } from "@/components/questions/reply-form";
import { ThreadedReplies } from "@/components/questions/threaded-replies";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PollVoter } from "@/components/poll-voter";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { trackPostView } from "@/api/analytics";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";

export default function QuestionDetailPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const { open: openAuthModal } = useAuthModal();

  const { data: questionItem, isLoading: isQuestionLoading } =
    useQuestionQuery(questionId);
  const { data: replies = [], isLoading: isRepliesLoading } =
    useRepliesQuery(questionId);
  const { mutate: deleteQuestion } = useDeleteQuestion();
  const { mutate: handleVote, isPending: isVotePending } = useUpdateVote();
  const { mutate: deleteReply } = useDeleteReply();

  useEffect(() => {
    if (questionId) {
      trackPostView(questionId);
    }
  }, [questionId]);

  const { open: openEditModal } = useEditPostModal();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [pitchContent, setPitchContent] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [showInterestForm, setShowInterestForm] = useState(false);

  // Partner application hooks
  const { mutate: applyToPartner, isPending: isApplyPending } =
    useApplyToPartner();
  const { mutate: sendInterestDM, isPending: isDMPending } =
    useExpressInterestViaDM();
  const { data: applications = [] } = usePartnerApplicationsQuery(
    questionItem?.question?.postType === "partner" &&
      user?.username === questionItem?.question?.authorUsername
      ? questionId
      : undefined,
  );
  const { mutate: updateAppStatus } = useUpdatePartnerApplicationStatus();

  if (isQuestionLoading) {
    return (
      <div className="max-w-[40rem] w-full md:mt-24 mt-16 px-4 space-y-6">
        <Skeleton className="h-4 w-16 mb-6" />
        <div className="flex items-start gap-4">
          <Skeleton className="size-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!questionItem) {
    return (
      <div className="max-w-xl w-full mt-40 px-4 text-center">
        <p className="text-neutral-500">Post not found</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <HugeiconsIcon icon={ArrowLeft02Icon} className="mr-2 size-4" />
          Go back
        </Button>
      </div>
    );
  }

  const { question, author } = questionItem;
  const isPinned = !!question.isPinned;
  const isSolved = !!question.acceptedAnswerUid;

  const handlePartnerApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("signin");
      return;
    }
    if (!pitchContent.trim() || !questionId) return;
    applyToPartner(
      { questionId, pitch: pitchContent },
      {
        onSuccess: () => {
          toastManager.add({ title: "Application submitted!", type: "success" });
          setPitchContent("");
          setIsApplying(false);
        },
        onError: (err) => {
          handleApiError(err, "Failed to submit application");
        },
      },
    );
  };

  const handleStatusChange = (
    appUid: string,
    status: "accepted" | "declined",
  ) => {
    if (!questionId) return;
    updateAppStatus({ questionId, appUid, status });
  };

  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 pb-36 md:pb-16 relative px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-6 transition-colors cursor-pointer"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
        Back
      </button>

      {/* Main Post Container */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-background rounded-2xl p-5 mb-6 space-y-4">
        {/* Author details */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {question.isAnonymous ? (
              <UserAvatar
                src={undefined}
                name="Anonymous"
                className="size-9"
              />
            ) : (
              <Link to={`/u/${question.authorUsername}`}>
                <UserAvatar
                  src={author?.avatar}
                  name={question.authorUsername}
                  className="size-9"
                />
              </Link>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-neutral-800 dark:text-neutral-200">
                  {question.isAnonymous ? "Anonymous" : question.authorUsername}
                </span>
                {isPinned && (
                  <span className="text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded">
                    Pinned
                  </span>
                )}
                {isSolved && (
                  <span className="text-[9px] uppercase tracking-wide bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                    Solved
                  </span>
                )}
                {question.chamberName && (
                  <Link
                    to={`/chamber/${question.chamberUid}`}
                    className="text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2 py-0.5 rounded-full text-neutral-500 transition-colors"
                  >
                    in {question.chamberName}
                  </Link>
                )}
              </div>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                {question.timeCreated &&
                  formatDistanceToNowStrict(new Date(question.timeCreated), {
                    addSuffix: true,
                  })}
              </span>
            </div>
          </div>

          {/* Action options */}
          <div className="flex items-center gap-2">
            {user?.username === question.authorUsername && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEditModal(question)}
                >
                  <HugeiconsIcon
                    icon={PencilEdit02Icon}
                    className="size-4 text-neutral-500"
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowDeleteAlert(true)}
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content body */}
        <PostContent
          content={question.content}
          className="text-base text-neutral-900 dark:text-neutral-100 leading-relaxed font-light"
        />

        {/* Poll voter */}
        {question.postType === "poll" && question.pollUid && (
          <PollVoter
            questionId={questionId!}
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
          Object.keys(question.customFields).filter((k) => !k.startsWith("_"))
            .length > 0 &&
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
                key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              const type = customFields._fieldTypes?.[key] || fieldDef?.type;
              const isImage =
                type === "image" ||
                (val &&
                  typeof val === "object" &&
                  "url" in val &&
                  (val.type?.startsWith("image/") ||
                    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
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

            if (!hasMetadata && !hasImages && !hasFiles)
              return null;

            return (
              <div className="mt-4 p-4 flex flex-col gap-4 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl w-full">
                {/* Metadata fields list (excluding files/images) */}
                {hasMetadata && (
                  <div className="flex flex-col gap-1.5 min-w-0 w-full">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {entries.map(([key, val]) => {
                        if (val === undefined || val === null || val === "")
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
                                info.disabled && "opacity-50 line-through",
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
                                info.disabled && "opacity-50 line-through",
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
                        if (info.type === "location" || key === "location") {
                          const showLabel = !["location"].includes(
                            info.label.toLowerCase().trim(),
                          );
                          return (
                            <div
                              key={key}
                              className={cn(
                                "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm text-xs font-bold text-neutral-850 dark:text-neutral-100",
                                info.disabled && "opacity-50 line-through",
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
                          if (!routeVal?.source && !routeVal?.destination)
                            return null;
                          return (
                            <div
                              key={key}
                              className={cn(
                                "inline-flex items-center gap-2 h-8 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm text-xs font-bold text-neutral-850 dark:text-neutral-100",
                                info.disabled && "opacity-50 line-through",
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
                                info.disabled && "opacity-50 line-through",
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
                                  authorUsername: question.authorUsername!,
                                  templateMessage:
                                    btnVal.template ||
                                    `Hey, I'm interested in your post!`,
                                });
                                toastManager.add({ title: "Interest sent via DM!", type: "success" });
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
                          (typeof val === "string" && val.startsWith("http"))
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
                                info.disabled && "opacity-50 line-through",
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
                        if (val === undefined || val === null || val === "")
                          return null;

                        const info = getFieldInfo(key, val);
                        if (!info.isImage) return null;

                        const file = val as
                          | { url: string; name: string }
                          | string;
                        const imageUrl =
                          typeof file === "string" ? file : file.url;
                        const imageName =
                          typeof file === "string" ? info.label : file.name;

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
                    <div className="flex flex-col gap-2">
                      {entries.map(([key, val]) => {
                        if (val === undefined || val === null || val === "")
                          return null;

                        const info = getFieldInfo(key, val);
                        if (!info.isFile) return null;

                        const file = val as {
                          url: string;
                          name: string;
                          size: number;
                          type: string;
                        };
                        let fileIcon = (
                          <FileIcon className="size-5 text-neutral-500 shrink-0" />
                        );
                        const ext = file.name.split(".").pop()?.toLowerCase();
                        if (file.type?.includes("pdf") || ext === "pdf")
                          fileIcon = (
                            <FileText className="size-5 text-red-500 shrink-0" />
                          );
                        else if (
                          file.type?.includes("zip") ||
                          file.type?.includes("tar") ||
                          ext === "zip" ||
                          ext === "rar"
                        )
                          fileIcon = (
                            <FileArchive className="size-5 text-amber-500 shrink-0" />
                          );
                        else if (
                          file.type?.includes("sheet") ||
                          file.type?.includes("excel") ||
                          ext === "xls" ||
                          ext === "xlsx"
                        )
                          fileIcon = (
                            <FileSpreadsheet className="size-5 text-emerald-500 shrink-0" />
                          );

                        return (
                          <div
                            key={key}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(file.url, "_blank");
                            }}
                            className={cn(
                              "flex items-center justify-between p-3 border border-neutral-200/60 dark:border-neutral-800/80 bg-white hover:bg-neutral-50 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/80 rounded-2xl cursor-pointer transition-all duration-150 group",
                              info.disabled && "opacity-75",
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 max-w-[80%]">
                              <div className="group-hover:scale-105 transition-transform shrink-0">
                                {fileIcon}
                              </div>
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
                                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-center size-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-500 dark:text-neutral-400 shrink-0">
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

        {/* METADATA INTERFACE FOR TRADE OR PARTNERS */}
        {question.postType === "trade" && (
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase block">
                  Price
                </span>
                <span className="text-lg text-neutral-800 dark:text-neutral-200 mt-1 block">
                  ₹
                  {question.tradePrice
                    ? (question.tradePrice / 100).toFixed(0)
                    : "0"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase block">
                  Condition
                </span>
                <span className="text-sm capitalize text-neutral-800 dark:text-neutral-200 mt-1 block">
                  {question.tradeCondition || "Unknown"}
                </span>
              </div>
              {question.tradeBookIsbn && (
                <div className="col-span-2 border-t border-neutral-200/50 pt-2">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase block">
                    Book ISBN
                  </span>
                  <span className="text-xs font-mono text-neutral-700 dark:text-neutral-300 block">
                    {question.tradeBookIsbn}
                  </span>
                </div>
              )}
              <div className="col-span-2 border-t border-neutral-200/50 pt-2 flex items-center justify-between">
                <span className="text-xs text-neutral-500">Status</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full capitalize ${
                    question.tradeStatus === "available"
                      ? "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                  }`}
                >
                  {question.tradeStatus}
                </span>
              </div>
            </div>
            {!question.isAnonymous && user?.username !== question.authorUsername &&
              question.tradeStatus === "available" && (
                <div className="border-t border-neutral-200/50 pt-3">
                  {!showInterestForm ? (
                    <Button
                      variant="default"
                      onClick={() => {
                        if (!user) {
                          openAuthModal("signin");
                          return;
                        }
                        setShowInterestForm(true);
                      }}
                      className="w-full"
                    >
                      I'm Interested
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Message for {question.authorUsername} (optional)
                      </label>
                      <Textarea
                        placeholder="e.g. Is this still available? Can I pick it up today?"
                        value={interestMessage}
                        onChange={(e) => setInterestMessage(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowInterestForm(false);
                            setInterestMessage("");
                          }}
                          type="button"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            sendInterestDM({
                              authorUsername: question.authorUsername!,
                              templateMessage: interestMessage
                                ? `${interestMessage}\n\n(re: ${question.content.slice(0, 200)})`
                                : `Hey! I'm interested in: ${question.content.slice(0, 200)}`,
                            });
                            setShowInterestForm(false);
                            setInterestMessage("");
                          }}
                          disabled={isDMPending}
                        >
                          {isDMPending ? "Sending..." : "Send Message"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}

        {question.postType === "partner" && (
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
              <span className="text-xs text-neutral-500 uppercase tracking-wider">
                Partner Requirements
              </span>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1.5",
                  (question.partnerStatus ?? "open") === "open"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-450"
                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-450",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full inline-block shrink-0",
                    (question.partnerStatus ?? "open") === "open"
                      ? "bg-emerald-500"
                      : "bg-neutral-400",
                  )}
                />
                {question.partnerStatus ?? "open"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-background">
                <HugeiconsIcon
                  icon={UserMultiple02Icon}
                  className="size-4 text-neutral-400 mx-auto"
                />
                <span className="text-[9px] text-neutral-400 uppercase block mt-1">
                  Slots
                </span>
                <span className="text-sm text-neutral-800 dark:text-neutral-200 mt-0.5 block">
                  {question.partnerSlotsNeeded || 0} left
                </span>
              </div>
              <div className="text-center p-2 rounded-lg bg-background">
                <span className="text-[9px] text-neutral-400 uppercase block">
                  Grade Goal
                </span>
                <span className="text-xs text-neutral-800 dark:text-neutral-200 mt-2 block capitalize">
                  {question.partnerTargetGrade || "Any"}
                </span>
              </div>
              <div className="text-center p-2 rounded-lg bg-background">
                <span className="text-[9px] text-neutral-400 uppercase block">
                  Workstyle
                </span>
                <span className="text-xs text-neutral-800 dark:text-neutral-200 mt-2 block capitalize">
                  {question.partnerWorkstyle || "Any"}
                </span>
              </div>
            </div>

            {/* Apply Button */}
            {!question.isAnonymous && user?.username !== question.authorUsername &&
              (question.partnerStatus ?? "open") === "open" && (
                <div>
                  {!isApplying ? (
                    <Button
                      variant="default"
                      onClick={() => {
                        if (!user) {
                          openAuthModal("signin");
                        } else {
                          setIsApplying(true);
                        }
                      }}
                      className="w-full"
                    >
                      Express Interest in Joining
                    </Button>
                  ) : (
                    <form
                      onSubmit={handlePartnerApply}
                      className="space-y-2 mt-2"
                    >
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Why are you interested / what are your skills?
                      </label>
                      <Textarea
                        required
                        placeholder="e.g. I got an A- in CS-101 and have experience with React..."
                        value={pitchContent}
                        onChange={(e) => setPitchContent(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsApplying(false)}
                          type="button"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          type="submit"
                          disabled={isApplyPending}
                        >
                          {isApplyPending ? "Submitting..." : "Send Request"}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
          </div>
        )}
        {question.postType === "taxi" && (
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
              <span className="text-xs text-neutral-500 uppercase tracking-wider">
                Trip Details
              </span>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1.5",
                  (question.taxiStatus ?? "open") === "open"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-450"
                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-450",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full inline-block shrink-0",
                    (question.taxiStatus ?? "open") === "open"
                      ? "bg-emerald-500"
                      : "bg-neutral-400",
                  )}
                />
                {question.taxiStatus ?? "open"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {question.taxiDeparture && (
                <div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase block">
                    From
                  </span>
                  <span className="text-sm text-neutral-800 dark:text-neutral-200 mt-1 block">
                    {question.taxiDeparture}
                  </span>
                </div>
              )}
              {question.taxiDestination && (
                <div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase block">
                    To
                  </span>
                  <span className="text-sm text-neutral-800 dark:text-neutral-200 mt-1 block">
                    {question.taxiDestination}
                  </span>
                </div>
              )}
              {question.taxiDatetime && (
                <div className="col-span-2 border-t border-neutral-200/50 pt-2">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase block">
                    Departure Time
                  </span>
                  <span className="text-sm text-neutral-800 dark:text-neutral-200 mt-1 block">
                    {new Date(question.taxiDatetime).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              )}
              {question.taxiSeatsAvailable && (
                <div className="col-span-2 border-t border-neutral-200/50 pt-2">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase block">
                    Seats Available
                  </span>
                  <span className="text-sm text-neutral-800 dark:text-neutral-200 mt-1 block">
                    {question.taxiSeatsAvailable}
                  </span>
                </div>
              )}
            </div>
            {!question.isAnonymous && user?.username !== question.authorUsername &&
              (question.taxiStatus ?? "open") === "open" && (
                <div className="border-t border-neutral-200/50 pt-3">
                  {!showInterestForm ? (
                    <Button
                      variant="default"
                      onClick={() => {
                        if (!user) {
                          openAuthModal("signin");
                          return;
                        }
                        setShowInterestForm(true);
                      }}
                      className="w-full"
                    >
                      I Want to Join
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Message for {question.authorUsername} (optional)
                      </label>
                      <Textarea
                        placeholder="e.g. I'm at the same departure point, happy to split!"
                        value={interestMessage}
                        onChange={(e) => setInterestMessage(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowInterestForm(false);
                            setInterestMessage("");
                          }}
                          type="button"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            sendInterestDM({
                              authorUsername: question.authorUsername!,
                              templateMessage: interestMessage
                                ? `${interestMessage}\n\n(joining trip from ${question.taxiDeparture || "?"} to ${question.taxiDestination || "?"})`
                                : `Hey! I'd like to join the trip from ${question.taxiDeparture || "?"} to ${question.taxiDestination || "?"}. Is there still space?`,
                            });
                            setShowInterestForm(false);
                            setInterestMessage("");
                          }}
                          disabled={isDMPending}
                          variant="default"
                        >
                          {isDMPending ? "Sending..." : "Send Request"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}
      </div>

      {/* PARTNER APPLICATIONS MANAGEMENT (Visible to Author only) */}
      {question.postType === "partner" &&
        user?.username === question.authorUsername && (
          <div className="space-y-3 mb-6">
            <h3 className=" text-neutral-800 dark:text-neutral-200 text-sm">
              Interest Dashboard ({applications.length})
            </h3>
            {applications.length === 0 ? (
              <EmptyState
                title="No one has applied yet"
                description="Share this post in your study chats!"
              />
            ) : (
              <div className="space-y-2">
                {applications.map((app: any) => (
                  <div
                    key={app.uid}
                    className="p-4 border border-neutral-300 dark:border-neutral-800 rounded-2xl bg-neutral-50/20 dark:bg-neutral-900/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          src={app.applicantAvatar}
                          name={app.applicantUsername}
                          className="size-6"
                        />
                        <span className="text-xs ">
                          {app.applicantUsername}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {formatDistanceToNowStrict(new Date(app.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed italic bg-background p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      "{app.pitch}"
                    </p>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[9px] uppercase text-neutral-400">
                        Status: <span className="capitalize">{app.status}</span>
                      </span>
                      {app.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="destructive-outline"
                            size="xs"
                            onClick={() =>
                              handleStatusChange(app.uid, "declined")
                            }
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChange(app.uid, "accepted")
                            }
                            className="rounded-full px-3 h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                          >
                            Accept
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Answers / Replies Thread Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-neutral-900 dark:text-neutral-100 px-1">
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={BubbleChatIcon} className="size-4" />
            <span className="text-neutral-400 font-medium">
              {replies.length}
            </span>
          </span>
          <UpvoteButton
            count={question.upvotes}
            isUpvoted={question.isUpvoted}
            onToggle={() => {
              if (!user) {
                openAuthModal("signin");
              } else {
                handleVote(questionId!);
              }
            }}
            isPending={isVotePending}
          />
        </div>

        {/* Reply Publisher Card */}
        {user ? (
          <ReplyForm questionId={questionId!} />
        ) : (
          <div className="p-5 border border-neutral-200 dark:border-neutral-800 bg-background rounded-2xl text-center">
            <p className="text-xs text-neutral-500 mb-2">
              Sign in to participate in the conversation
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => openAuthModal("signin")}
            >
              Sign in to Reply
            </Button>
          </div>
        )}

        {isRepliesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : replies.length > 0 ? (
          <div className="pl-1">
            <ThreadedReplies
              replies={replies}
              questionId={questionId!}
              authorUsername={question.authorUsername}
              isAnonymousPost={!!question.isAnonymous}
              onDelete={(replyId) =>
                deleteReply({ questionId: questionId!, replyId })
              }
            />
          </div>
        ) : (
          <EmptyState
            title="No comments yet"
            description="Write a response above!"
            className="py-6"
          />
        )}
      </div>

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
              onClick={() =>
                deleteQuestion(questionId!, { onSuccess: () => navigate(-1), onError: (err) => handleApiError(err, "Failed to delete post") })
              }
            >
              Delete
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </PageTransition>
  );
}
