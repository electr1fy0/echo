import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MentionField } from "@/components/ui/mention-field";
import { useCreateReply } from "@/hooks/use-replies";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Comment01Icon,
  Image01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useWebHaptics } from "@/lib/haptic";
import type { QuestionId } from "@/types";
import { validateMentions } from "@/lib/mention-validation";
import { uploadImagePresigned } from "@/api/upload";

import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { cn } from "@/lib/utils";

type ReplyFormProps = {
  questionId: QuestionId;
  parentReplyUid?: string;
  replyingToUsername?: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
};

export function ReplyForm({
  questionId,
  parentReplyUid,
  replyingToUsername,
  onSubmitSuccess,
  onCancel,
  compact,
}: ReplyFormProps) {
  const { data: user } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const [content, setContent] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const { mutate: submitReply, isPending } = useCreateReply();
  const [isValidating, setIsValidating] = useState(false);
  const { trigger } = useWebHaptics();

  if (!user) {
    return (
      <div className="text-sm mt-4 text-neutral-500 py-2">
        Please{" "}
        <button
          onClick={() => openAuthModal("signin")}
          className="text-[var(--brand)] hover:underline font-semibold cursor-pointer bg-transparent border-none p-0 inline"
        >
          sign in
        </button>{" "}
        to reply.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending || isValidating) return;
    trigger("success");
    setIsValidating(true);
    try {
      const result = await validateMentions(content);
      if (result.missing.length > 0) {
        toast.error(`User not found: ${result.missing.join(", ")}`);
        setIsValidating(false);
        return;
      }
      submitReply(
        { questionId, content, parentReplyUid },
        {
          onSuccess: () => {
            setContent("");
            toast.success("Reply posted");
            onSubmitSuccess?.();
          },
          onError: () => {
            toast.error("Failed to submit reply. Please try again.");
          },
          onSettled: () => {
            setIsValidating(false);
          },
        },
      );
    } catch {
      toast.error("Failed to validate mentions");
      setIsValidating(false);
    }
  };

  return (
    <form
      className={cn("flex gap-4 items-start", compact ? "mt-2" : "mt-4")}
      onSubmit={handleSubmit}
    >
      <div className="flex-1 space-y-2">
        {replyingToUsername && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Replying to{" "}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              @{replyingToUsername}
            </span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="ml-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </p>
        )}
        <MentionField
          value={content}
          placeholder="Write a reply..."
          ariaLabel="Reply content"
          className="text-base md:text-sm"
          onValueChange={setContent}
          multiline={true}
          containerClassName="w-full"
        />
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={imageUploading}
            onClick={() =>
              document.getElementById("reply-image-input")?.click()
            }
            className="flex items-center gap-1.5 h-7 px-2 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 cursor-pointer transition-colors disabled:opacity-50"
          >
            {imageUploading ? (
              <span className="inline-block size-3.5 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin" />
            ) : (
              <HugeiconsIcon icon={Image01Icon} className="size-3.5" />
            )}
            {imageUploading ? "Uploading..." : "Image"}
          </button>
          <input
            id="reply-image-input"
            type="file"
            accept="image/*"
            className="hidden"
            disabled={imageUploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImageUploading(true);
              try {
                const url = await uploadImagePresigned(file);
                setContent((prev) => prev + `\n${url}\n`);
              } catch {
                toast.error("Image upload failed");
              } finally {
                setImageUploading(false);
                e.target.value = "";
              }
            }}
          />
        </div>
      </div>
      <Button
        variant="outline"
        disabled={!content.trim() || isValidating || isPending}
        type="submit"
      >
        {isPending ? (
          <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
        ) : (
          <>
            <HugeiconsIcon icon={Comment01Icon} className="mr-1 size-4" />
            <span className="text-sm text-neutral-800 dark:text-neutral-200">
              Reply
            </span>
          </>
        )}
      </Button>
    </form>
  );
}
