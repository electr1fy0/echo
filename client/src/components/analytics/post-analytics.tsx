import { usePostAnalytics } from "@/hooks/use-analytics";
import { EvilAreaChart, Area, XAxis, Grid } from "@/components/evilcharts/charts/area-chart";
import { Skeleton } from "@/components/ui/skeleton";
import NumberFlow from "@number-flow/react";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";

const viewsConfig = {
  count: {
    label: "Views",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
} satisfies ChartConfig;

export function PostAnalytics({ postUid }: { postUid: string }) {
  const { data: analytics, isLoading } = usePostAnalytics(postUid);

  if (isLoading) {
    return (
      <div className="p-2.5 sm:p-4 space-y-3 sm:space-y-4">
        <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 sm:h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-28 sm:h-32 rounded-lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-2.5 sm:p-4 text-xs sm:text-sm text-neutral-500">Analytics not available.</div>
    );
  }

  const viewData = analytics.viewsTrend.length > 0
    ? analytics.viewsTrend.map((v) => ({ date: v.date, count: v.count }))
    : [{ date: new Date().toISOString().split("T")[0], count: 0 }];

  return (
    <div className="p-2.5 sm:p-4">
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-[11px] text-neutral-500 mb-0.5 sm:mb-1 leading-tight">Views</p>
          <p className="text-sm sm:text-lg font-semibold tabular-nums leading-none">
            <NumberFlow value={analytics.totalViews} />
          </p>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-[11px] text-neutral-500 mb-0.5 sm:mb-1 leading-tight">Unique</p>
          <p className="text-sm sm:text-lg font-semibold tabular-nums leading-none">
            <NumberFlow value={analytics.uniqueViewers} />
          </p>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-[11px] text-neutral-500 mb-0.5 sm:mb-1 leading-tight">Replies</p>
          <p className="text-sm sm:text-lg font-semibold tabular-nums leading-none">
            <NumberFlow value={analytics.replyCount} />
          </p>
        </div>
      </div>

      <div className="h-28 sm:h-32">
        <EvilAreaChart data={viewData} config={viewsConfig}>
          <Area dataKey="count" variant="gradient" />
          <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} />
          <Grid />
        </EvilAreaChart>
      </div>
    </div>
  );
}
