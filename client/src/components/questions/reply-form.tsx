import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MentionField } from "@/components/ui/mention-field";
import { useCreateReply } from "@/hooks/use-replies";
import { HugeiconsIcon } from "@hugeicons/react";
import { Comment01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { toast } from "@/lib/toast";
import type { QuestionId } from "@/types";
import { validateMentions } from "@/lib/mention-validation";

type ReplyFormProps = {
  questionId: QuestionId;
  onSubmitSuccess?: () => void;
};

export function ReplyForm({ questionId, onSubmitSuccess }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const { mutate: submitReply, isPending } = useCreateReply();
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending || isValidating) return;
    setIsValidating(true);
    try {
      const result = await validateMentions(content);
      if (result.missing.length > 0) {
        toast.error(`User not found: ${result.missing.join(", ")}`);
        setIsValidating(false);
        return;
      }
      submitReply(
        { questionId, content },
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
    <form className="flex gap-4 mt-4" onSubmit={handleSubmit}>
      <MentionField
        value={content}
        placeholder="Write a reply..."
        ariaLabel="Reply content"
        className="text-base"
        onValueChange={setContent}
        multiline={false}
        containerClassName="flex-1"
      />
      <Button
        variant="outline"
        disabled={!content.trim() || isValidating || isPending}
        type="submit"
        className=""
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
