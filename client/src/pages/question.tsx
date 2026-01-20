import { useParams, useNavigate, Link } from "react-router";
import { useState } from "react";
import { useQuestionQuery, useUpdateQuestion, useDeleteQuestion } from "@/hooks/use-questions";
import { useRepliesQuery, useDeleteReply } from "@/hooks/use-replies";
import { useUpdateVote } from "@/hooks/use-upvote";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpvoteButton } from "@/components/upvote-button";
import { ReplyItem } from "@/components/questions/reply-item";
import { ReplyForm } from "@/components/questions/reply-form";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format-time";
import { toast } from "@/components/ui/toast";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft02Icon,
    MoreHorizontalIcon,
    Delete02Icon,
    PencilEdit02Icon,
    Copy01Icon,
    Alert01Icon,
} from "@hugeicons/core-free-icons";

function QuestionDetailSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function QuestionPage() {
    const { questionId } = useParams<{ questionId: string }>();
    const navigate = useNavigate();
    const { data: questionItem, isLoading } = useQuestionQuery(questionId);
    const { data: replies = [] } = useRepliesQuery(questionId);
    const { mutate: deleteReply } = useDeleteReply();
    const { mutate: handleVote, isPending: isVotePending } = useUpdateVote();
    const { mutate: updateQuestion, isPending: isUpdatePending } = useUpdateQuestion();
    const { mutate: deleteQuestion } = useDeleteQuestion();
    const { data: user } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState("");

    const question = questionItem?.question;
    const author = questionItem?.author;

    function handleSave() {
        if (!questionId || !editedContent.trim()) return;
        updateQuestion(
            { questionId, content: editedContent },
            {
                onSuccess: () => setIsEditing(false),
            },
        );
    }

    function handleDelete() {
        if (!questionId) return;
        deleteQuestion(questionId, {
            onSuccess: () => {
                toast.success("Question deleted");
                navigate(-1);
            },
        });
    }

    function startEditing() {
        if (question) {
            setEditedContent(question.content);
            setIsEditing(true);
        }
    }

    return (
        <div className="max-w-[40rem] w-full md:mt-32 mt-20 space-y-6 mb-40 relative px-4 pb-20 md:pb-0">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
                <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
                Back
            </button>

            {isLoading ? (
                <QuestionDetailSkeleton />
            ) : question ? (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
                        <div className="flex items-start gap-4">
                            <Link
                                to={question.authorUsername ? `/u/${question.authorUsername}` : "#"}
                                className="shrink-0"
                            >
                                <UserAvatar
                                    src={author?.avatar}
                                    name={question.authorUsername || "Anonymous"}
                                    className="size-10"
                                />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            to={question.authorUsername ? `/u/${question.authorUsername}` : "#"}
                                            className="text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:underline"
                                        >
                                            {question.authorUsername || "Anonymous"}
                                        </Link>
                                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                            {question.timeCreated &&
                                                formatRelativeTime(new Date(question.timeCreated))}
                                        </span>
                                        {question.chamberName && (
                                            <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                                in {question.chamberName}
                                            </span>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="outline-none">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="More options"
                                                className="h-8 w-8 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
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
                                                <HugeiconsIcon icon={Copy01Icon} className="mr-2 size-4" />
                                                Copy Text
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => alert("Reported content")}>
                                                <HugeiconsIcon icon={Alert01Icon} className="mr-2 size-4" />
                                                Report
                                            </DropdownMenuItem>
                                            {user?.username === question.authorUsername && (
                                                <>
                                                    <DropdownMenuItem onClick={startEditing}>
                                                        <HugeiconsIcon icon={PencilEdit02Icon} className="mr-2 size-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                                                        <HugeiconsIcon icon={Delete02Icon} className="mr-2 size-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {isEditing ? (
                                    <div className="mt-3">
                                        <Textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="min-h-[100px] bg-background mb-3"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setIsEditing(false)}
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
                                    <p className="mt-3 text-base text-neutral-900 dark:text-neutral-100 leading-relaxed whitespace-pre-wrap">
                                        {question.content}
                                    </p>
                                )}

                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <UpvoteButton
                                        count={question.upvotes}
                                        isUpvoted={question.isUpvoted}
                                        onToggle={() => questionId && handleVote(questionId)}
                                        isPending={isVotePending}
                                        className="h-8 px-3"
                                    />
                                    <span className="text-sm text-neutral-500">
                                        {replies.length} {replies.length === 1 ? "reply" : "replies"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                            Replies
                        </h3>
                        <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                            {replies.length > 0 ? (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {replies.map((reply, index) => (
                                        <div key={reply.answer.uid ?? index} className="px-4">
                                            <ReplyItem
                                                answerItem={reply}
                                                onDelete={() =>
                                                    questionId &&
                                                    deleteReply({ questionId, replyId: reply.answer.uid ?? "" })
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-sm text-neutral-500">
                                    No replies yet. Be the first to respond!
                                </div>
                            )}
                            <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 pb-4">
                                {questionId && <ReplyForm questionId={questionId} />}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-neutral-500">Question not found</p>
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
                        Go Back
                    </Button>
                </div>
            )}
        </div>
    );
}
