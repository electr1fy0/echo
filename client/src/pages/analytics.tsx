import { useUserAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message01Icon,
  Edit01Icon,
  ThumbsUpIcon,
  EyeIcon,
  FireIcon,
  Award01Icon,
  Activity01Icon,
  AnalyticsUpIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { CalendarHeatmap } from "@/components/evilcharts/charts/calendar-heatmap";

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: typeof Edit01Icon;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <Card
      className={cn(
        "p-3 flex items-center gap-3",
        accent === "amber" && "ring-1 ring-amber-200 dark:ring-amber-800",
      )}
    >
      <div
        className={cn(
          "size-9 rounded-xl flex items-center justify-center shrink-0",
          accent === "amber"
            ? "bg-amber-100 dark:bg-amber-900/40"
            : "bg-neutral-100 dark:bg-neutral-800",
        )}
      >
        <HugeiconsIcon
          icon={icon}
          className={cn(
            "size-4",
            accent === "amber"
              ? "text-amber-600 dark:text-amber-400"
              : "text-neutral-600 dark:text-neutral-400",
          )}
        />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium leading-tight">
          {label}
        </p>
        <p className="text-lg font-semibold tracking-tight mt-0.5 tabular-nums leading-none">
          {value}
        </p>
      </div>
    </Card>
  );
}

function StreakCard({
  current,
  longest,
}: {
  current: number;
  longest: number;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <HugeiconsIcon
          icon={FireIcon}
          className="size-4 text-amber-500 shrink-0"
        />
        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Streaks
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Current
          </p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
            {current}
            <span className="text-xs font-medium text-amber-500 dark:text-amber-400 ml-1">
              days
            </span>
          </p>
        </div>
        <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex-1">
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
            Best
          </p>
          <p className="text-xl font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
            {longest}
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-1">
              days
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}

function EngagementCard({
  replyRate,
  avgUpvotes,
}: {
  replyRate: number;
  avgUpvotes: number;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <HugeiconsIcon
          icon={Activity01Icon}
          className="size-4 text-blue-500 shrink-0"
        />
        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Engagement
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
            Reply Rate
          </p>
          <p className="text-xl font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
            {(replyRate * 100).toFixed(0)}
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-0.5">
              %
            </span>
          </p>
        </div>
        <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex-1">
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
            Avg Upvotes
          </p>
          <p className="text-xl font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
            {avgUpvotes.toFixed(1)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto px-3 pt-4 pb-24 space-y-3">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}

export default function AnalyticsPage() {
  const { isLoading: authLoading } = useAuth();
  const { data: analytics, isLoading } = useUserAnalytics();

  if (authLoading || isLoading) {
    return <LoadingSkeleton />;
  }

  if (!analytics) return null;

  return (
    <PageTransition>
      <div className="w-full max-w-3xl mx-auto px-3 pt-4 pb-24 space-y-3 overflow-x-hidden">
        <div className="mb-1">
          <h1 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            Analytics
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Your activity and engagement
          </p>
        </div>

        <StreakCard
          current={analytics.streaks.currentStreak}
          longest={analytics.streaks.longestStreak}
        />

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Edit01Icon}
            label="Posts"
            value={analytics.totals.posts}
          />
          <StatCard
            icon={Message01Icon}
            label="Replies"
            value={analytics.totals.replies}
          />
          <StatCard
            icon={ThumbsUpIcon}
            label="Upvotes"
            value={analytics.totals.upvotesReceived}
          />
          <StatCard
            icon={EyeIcon}
            label="Views"
            value={analytics.totals.profileViews}
          />
        </div>

        <EngagementCard
          replyRate={analytics.engagement.replyRate}
          avgUpvotes={analytics.engagement.avgUpvotesPerPost}
        />

        <Card className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <HugeiconsIcon
              icon={AnalyticsUpIcon}
              className="size-4 text-green-500 shrink-0"
            />
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Activity
            </p>
          </div>
          <CalendarHeatmap data={analytics.calendar} />
          <div className="flex items-center gap-1 mt-2 justify-end">
            <span className="text-[10px] text-neutral-400">Less</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "size-2.5 rounded-sm",
                  i === 0 && "bg-neutral-100 dark:bg-neutral-800",
                  i === 1 && "bg-blue-200 dark:bg-blue-900/40",
                  i === 2 && "bg-blue-400 dark:bg-blue-700/60",
                  i === 3 && "bg-blue-600 dark:bg-blue-500/80",
                  i === 4 && "bg-blue-800 dark:bg-blue-400",
                )}
              />
            ))}
            <span className="text-[10px] text-neutral-400">More</span>
          </div>
        </Card>

        {analytics.topPosts.length > 0 && (
          <Card className="p-0">
            <div className="flex items-center gap-2 p-3 pb-0">
              <HugeiconsIcon
                icon={Award01Icon}
                className="size-4 text-purple-500 shrink-0"
              />
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Top Posts
              </p>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 mt-2">
              {analytics.topPosts.map((post, i) => (
                <div
                  key={post.uid}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 gap-2",
                    i === 0 && "bg-purple-50/50 dark:bg-purple-900/10",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {i === 0 && (
                      <span className="text-[10px] font-bold text-purple-500 shrink-0">
                        #1
                      </span>
                    )}
                    <p className="text-xs truncate leading-snug text-neutral-700 dark:text-neutral-300">
                      {post.content ?? "Untitled post"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] text-neutral-500 shrink-0">
                    <span className="tabular-nums">{post.upvotes}</span>
                    <span className="text-neutral-300 dark:text-neutral-600">·</span>
                    <span className="tabular-nums">{post.views}</span>
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
