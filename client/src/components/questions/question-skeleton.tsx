import { Skeleton } from "@/components/ui/skeleton";
export function QuestionSkeleton() {
    return (
        <div className="flex items-start gap-3 py-4 px-1">
            <Skeleton className="size-7 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full max-w-[280px]" />
            </div>
            <Skeleton className="h-7 w-14 rounded-full" />
        </div>
    );
}
export function QuestionListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-1">
            {Array.from({ length: count }).map((_, i) => (
                <QuestionSkeleton key={i} />
            ))}
        </div>
    );
}
