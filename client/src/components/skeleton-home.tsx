import { Skeleton } from "./ui/skeleton";

function SkeletonSidebar() {
  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-screen flex-col items-center py-8 border-r border-neutral-200 dark:border-neutral-800 bg-background w-20">
      <div className="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <img
          src="/turnsoutlogo.svg"
          alt="TurnsOut"
          className="size-7 invert dark:invert-0 opacity-60"
        />
      </div>
      <nav className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
        <Skeleton className="size-12 rounded-xl animate-none" />
        <Skeleton className="size-12 rounded-xl animate-none" />
        <Skeleton className="size-12 rounded-xl animate-none bg-primary/20" />
        <Skeleton className="size-12 rounded-xl animate-none" />
        <Skeleton className="size-12 rounded-xl animate-none" />
      </nav>
    </aside>
  );
}

function SkeletonQuestionItem() {
  return (
    <div className="py-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="size-8 rounded-full shrink-0 animate-none" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24 animate-none" />
          <Skeleton className="h-4 w-full animate-none" />
          <Skeleton className="h-4 w-3/4 animate-none" />
        </div>
      </div>
    </div>
  );
}
function SkeletonMain() {
  return (
    <div className="max-w-xl w-full md:mt-20 mt-16 space-y-4 px-4">
      <Skeleton className="h-6 w-16 animate-none" />
      <Skeleton className="h-4 w-40 animate-none" />
      <Skeleton className="h-20 w-full rounded-xl animate-none" />
      <div className="flex justify-end">
        <Skeleton className="h-9 w-24 rounded-full animate-none" />
      </div>
      <div className="mt-20 divide-y divide-border">
        {[...Array(4)].map((_, i) => (
          <SkeletonQuestionItem key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHome() {
  return (
    <div className="flex min-h-screen opacity-70 pointer-events-none">
      <SkeletonSidebar />
      <main className="w-full flex flex-col items-center">
        <SkeletonMain />
      </main>
    </div>
  );
}
