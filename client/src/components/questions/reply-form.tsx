import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MentionField } from "@/components/ui/mention-field";
import { useCreateReply } from "@/hooks/use-replies";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnonymousIcon,
  Comment01Icon,
  Image01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { handleApiError } from "@/lib/api-error";
import { toastManager } from "@/components/ui/toast";
import { useWebHaptics } from "@/lib/haptic";
import type { QuestionId } from "@/types";
import { validateMentions } from "@/lib/mention-validation";
import { uploadImagePresigned } from "@/api/upload";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { mutate: submitReply, isPending } = useCreateReply();
  const [isValidating, setIsValidating] = useState(false);
  const { trigger } = useWebHaptics();

  if (!user) {
    return (
      <div className="text-sm mt-4 text-neutral-500 py-2">
        Please{" "}
        <button
          onClick={() => openAuthModal("signin")}
          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer bg-transparent border-none p-0 inline"
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
        toastManager.add({ title: `User not found: ${result.missing.join(", ")}`, type: "error" });
        setIsValidating(false);
        return;
      }
      submitReply(
        { questionId, content, parentReplyUid, isAnonymous },
        {
          onSuccess: () => {
            setContent("");
            setIsAnonymous(false);
            toastManager.add({ title: "Reply posted", type: "success" });
            onSubmitSuccess?.();
          },
          onError: (err) => {
            handleApiError(err, "Failed to submit reply. Please try again.");
          },
          onSettled: () => {
            setIsValidating(false);
          },
        },
      );
    } catch {
      toastManager.add({ title: "Failed to validate mentions", type: "error" });
      setIsValidating(false);
    }
  };

  return (
    <form
      className={cn(compact ? "mt-2" : "mt-4")}
      onSubmit={handleSubmit}
    >
      {replyingToUsername && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
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
      <div className="relative flex items-end rounded-xl border border-input bg-background p-1.5">
        <MentionField
          value={content}
          placeholder="Write a reply..."
          ariaLabel="Reply content"
          className="min-h-10 pr-20"
          onValueChange={setContent}
          multiline={true}
          containerClassName="flex-1"
          unstyled
          style={{ resize: "none" }}
        />
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => setIsAnonymous((p) => !p)}
                  className={cn(
                    "size-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors",
                    isAnonymous
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                      : "bg-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300",
                  )}
                >
                  <HugeiconsIcon icon={AnonymousIcon} className="size-4" />
                </button>
              }
            />
            <TooltipContent side="top">
              {isAnonymous ? "Replying anonymously" : "Reply anonymously"}
            </TooltipContent>
          </Tooltip>
          <button
            type="button"
            disabled={imageUploading}
            onClick={() =>
              document.getElementById("reply-image-input")?.click()
            }
            className="size-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 cursor-pointer transition-colors disabled:opacity-50"
          >
            {imageUploading ? (
              <span className="inline-block size-3.5 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin" />
            ) : (
              <HugeiconsIcon icon={Image01Icon} className="size-4" />
            )}
          </button>
          <Button
            type="submit"
            disabled={!content.trim() || isValidating || isPending}
            className="size-8 p-0 rounded-lg cursor-pointer"
          >
            {isPending ? (
              <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon icon={Comment01Icon} className="size-4" />
            )}
          </Button>
        </div>
      </div>
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
            toastManager.add({ title: "Image upload failed", type: "error" });
          } finally {
            setImageUploading(false);
            e.target.value = "";
          }
        }}
      />
    </form>
  );
}
