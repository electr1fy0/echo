import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateReply } from "@/hooks/use-replies";
import { HugeiconsIcon } from "@hugeicons/react";
import { Comment01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import type { QuestionId } from "@/types";

type ReplyFormProps = {
  questionId: QuestionId;
  onSubmitSuccess?: () => void;
};

export function ReplyForm({ questionId, onSubmitSuccess }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const { mutate: submitReply, isPending } = useCreateReply();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;
    submitReply(
      { questionId, content },
      {
        onSuccess: () => {
          setContent("");
          toast.success("Reply posted");
          onSubmitSuccess?.();
        },
        onError: (err) => {
          console.error("Failed to submit reply:", err);
          toast.error("Failed to submit reply. Please try again.");
        },
      },
    );
  };

  return (
    <form className="flex gap-4 mt-4" onSubmit={handleSubmit}>
      <Input
        value={content}
        placeholder="Write a reply..."
        aria-label="Reply content"
        className="text-sm"
        onChange={(e) => setContent(e.target.value)}
      />
      <Button
        variant="outline"
        disabled={!content.trim()}
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
