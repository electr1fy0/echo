import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReplies, createReply } from "@/api/replies";

export function useRepliesQuery(questionId: string | undefined) {
    return useQuery({
        queryKey: ["replies", questionId],
        queryFn: () => fetchReplies(questionId!),
        enabled: !!questionId,
        staleTime: 30_000,
    });
}

export function useCreateReply(questionId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (content: string) => createReply(questionId, { content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["replies", questionId] });
        },
    });
}
