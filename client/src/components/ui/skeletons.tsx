import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
    return (
        <div className="max-w-[40rem] w-full mt-24 space-y-8 px-4">
            <div className="flex flex-col items-start gap-4">
                <div className="flex w-full justify-between items-start">
                    <Skeleton className="size-24 rounded-full" />
                    <Skeleton className="h-9 w-28 rounded-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-12 w-full max-w-md" />
                <div className="flex gap-6">
                    <div className="space-y-1">
                        <Skeleton className="h-5 w-8" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="space-y-1">
                        <Skeleton className="h-5 w-8" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ChamberCardSkeleton() {
    return (
        <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-md" />
                <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-full" />
        </div>
    );
}

export function ChamberListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-wrap gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-28 rounded-xl" />
            ))}
        </div>
    );
}

export function NotificationSkeleton() {
    return (
        <div className="flex items-start gap-3 p-4">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-full max-w-[200px]" />
            </div>
        </div>
    );
}

export function NotificationListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {Array.from({ length: count }).map((_, i) => (
                <NotificationSkeleton key={i} />
            ))}
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="space-y-4 w-full max-w-md px-4">
                <Skeleton className="h-8 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
            </div>
        </div>
    );
}
