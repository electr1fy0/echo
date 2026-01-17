import { useState } from "react";
import type { UpvoteState } from "@/types";

type UseUpvoteOptions = {
    initialCount?: number;
    initialUpvoted?: boolean;
};

type UseUpvoteReturn = UpvoteState & {
    toggle: () => void;
};
export function useUpvote({
    initialCount = 0,
    initialUpvoted = false,
}: UseUpvoteOptions = {}): UseUpvoteReturn {
    const [count, setCount] = useState(initialCount);
    const [isUpvoted, setIsUpvoted] = useState(initialUpvoted);

    const toggle = () => {
        setIsUpvoted((prev) => {
            setCount((c) => (prev ? c - 1 : c + 1));
            return !prev;
        });
    };

    return { count, isUpvoted, toggle };
}