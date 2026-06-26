import { useUserAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

import NumberFlow from "@number-flow/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message01Icon, Edit01Icon, ThumbsUpIcon, EyeIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { CalendarHeatmap } from "@/components/evilcharts/charts/calendar-heatmap";

function SummaryCard({ icon, label, value, sub }: { icon: typeof Edit01Icon; label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-4 flex items-start gap-3">
      <div className="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
        <HugeiconsIcon icon={icon} className="size-4 text-neutral-600 dark:text-neutral-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{label}</p>
        <p className="text-xl font-semibold tracking-tight mt-0.5 tabular-nums">
          {typeof value === "number" ? <NumberFlow value={value} /> : value}
        </p>
        {sub && <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { isLoading: authLoading } = useAuth();
  const { data: analytics, isLoading } = useUserAnalytics();

  if (authLoading || isLoading) {
    return (
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-24 space-y-6">
        <Skeleton className="h-8 w-36 sm:w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <PageTransition>
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-24">
        <div className="mb-6">
          <h1 className="text-xl">Analytics</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Your activity and engagement on TurnsOut
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <SummaryCard
            icon={Edit01Icon}
            label="Posts"
            value={analytics.totals.posts}
          />
          <SummaryCard
            icon={Message01Icon}
            label="Replies"
            value={analytics.totals.replies}
          />
          <SummaryCard
            icon={ThumbsUpIcon}
            label="Upvotes Received"
            value={analytics.totals.upvotesReceived}
          />
          <SummaryCard
            icon={EyeIcon}
            label="Profile Views"
            value={analytics.totals.profileViews}
          />
        </div>

        <Card className="p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden">
          <h2 className="text-sm font-medium mb-3 sm:mb-4">Activity Calendar</h2>
          <CalendarHeatmap data={analytics.calendar} />
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[11px] text-neutral-400">Less</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "size-3 rounded-sm",
                  i === 0 && "bg-neutral-100 dark:bg-neutral-800",
                  i === 1 && "bg-blue-200 dark:bg-blue-900/40",
                  i === 2 && "bg-blue-400 dark:bg-blue-700/60",
                  i === 3 && "bg-blue-600 dark:bg-blue-500/80",
                  i === 4 && "bg-blue-800 dark:bg-blue-400",
                )}
              />
            ))}
            <span className="text-[11px] text-neutral-400">More</span>
          </div>
        </Card>

        {analytics.topPosts.length > 0 && (
          <Card className="p-3 sm:p-4 overflow-hidden">
            <h2 className="text-sm font-medium mb-3 sm:mb-4">Top Posts</h2>
            <div className="space-y-3">
              {analytics.topPosts.map((post) => (
                <div
                  key={post.uid}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                >
                  <p className="text-sm truncate flex-1 mr-4">
                    {post.content ?? "Untitled post"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 shrink-0">
                    <span>{post.upvotes} upvotes</span>
                    <span>{post.views} views</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
