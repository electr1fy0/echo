import { useMutation } from "@tanstack/react-query";
import { reportContent } from "@/api/reports";
import { toastManager } from "@/components/ui/toast";
import { handleApiError } from "@/lib/api-error";

export function useReportContent() {
  return useMutation({
    mutationFn: ({ targetType, targetUid }: { targetType: "post" | "reply"; targetUid: string }) =>
      reportContent(targetType, targetUid),
    onSuccess: () => {
      toastManager.add({
        title: "Content reported",
        description: "Thank you for helping keep the community safe.",
        type: "success",
      });
    },
    onError: (err) => {
      handleApiError(err, "Failed to report content");
    },
  });
}
