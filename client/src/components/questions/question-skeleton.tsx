import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function QuestionSkeleton() {
    return (
        <div className="flex items-start gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0">
            {/* Avatar skeleton */}
            <Skeleton className="size-7 rounded-full shrink-0" />
            
            <div className="flex-1 space-y-3 min-w-0">
                {/* Header: Author + Timestamp */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-20 rounded" />
                    <span className="text-[10px] text-neutral-300 dark:text-neutral-700 select-none">•</span>
                    <Skeleton className="h-3 w-14 rounded" />
                </div>
                
                {/* Question body text skeletons */}
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-5/6 rounded" />
                </div>

                {/* Footer action bar skeleton */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        {/* Vote button mock */}
                        <Skeleton className="h-6 w-12 rounded-full" />
                        {/* Replies count mock */}
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    {/* Action button mock */}
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function QuestionListSkeleton({ count = 6, className }: { count?: number; className?: string }) {
    return (
        <div className={cn("space-y-0 dark:bg-[#1D1D1D] rounded-2xl overflow-hidden", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <QuestionSkeleton key={i} />
            ))}
        </div>
    );
}
