import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import {
  useInfiniteNotificationsQuery,
  useMarkNotificationsRead,
} from "@/hooks/use-notifications";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message01Icon,
  CircleArrowUp01Icon,
  InformationCircleIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { Award, Crosshair } from "lucide-react";
import type { Notification } from "@/api/notifications";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDistanceToNowStrict } from "date-fns";
import { NotificationListSkeleton } from "@/components/ui/skeletons";
import { Link, useNavigate } from "react-router";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { cn } from "@/lib/utils";

interface GroupedNotification {
  key: string;
  type: string;
  post_uid: string;
  post_slug?: string;
  reference_uid: string;
  content: string;
  question_content: string;
  created_at: string;
  actors: { username: string; avatar: string }[];
}

// function groupNotifications(list: Notification[]): GroupedNotification[] {
//   const groups = new Map<string, GroupedNotification>();

//   for (const n of list) {
//     const groupable =
//       n.type === "upvote_post" ||
//       n.type === "upvote_reply" ||
//       n.type === "express_interest";
//     const key = groupable ? `${n.type}::${n.post_uid}` : n.uid;

//     if (groupable && groups.has(key)) {
//       const g = groups.get(key)!;
//       g.actors.push({ username: n.actor_username, avatar: n.actor_avatar });
//       if (n.created_at > g.created_at) g.created_at = n.created_at;
//     } else {
//       groups.set(key, {
//         key,
//         type: n.type,
//         post_uid: n.post_uid,
//         reference_uid: n.reference_uid,
//         content: n.content,
//         question_content: n.question_content ?? "",
//         created_at: n.created_at,
//         actors: [{ username: n.actor_username, avatar: n.actor_avatar }],
//       });
//     }
//   }

//   return Array.from(groups.values());
// }

function Avatars({
  actors,
  max = 3,
}: {
  actors: { username: string; avatar: string }[];
  max?: number;
}) {
  const visible = actors.slice(0, max);
  const overlap = actors.length > max ? actors.length - max : 0;

  return (
    <div className="flex shrink-0 mt-1">
      {visible.map((a, i) => (
        <div key={a.username} className={cn("relative", i > 0 && "-ml-2")}>
          <UserAvatar
            src={a.avatar}
            name={a.username}
            className="size-7 ring-2 ring-white dark:ring-neutral-900"
          />
        </div>
      ))}
      {overlap > 0 && (
        <div className="-ml-2 size-7 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-medium text-neutral-500">
          +{overlap}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const navigate = useNavigate();
  const isUpvote = notification.type === "upvote_post";
  const isReply = notification.type === "reply_post";
  const isUpvoteReply = notification.type === "upvote_reply";
  const isMentionQuestion = notification.type === "mention_post";
  const isMentionReply = notification.type === "mention_reply";
  const isInterest = notification.type === "express_interest";
  const isMilestone = notification.type === "milestone";

  if (
    !isUpvote &&
    !isReply &&
    !isUpvoteReply &&
    !isMentionQuestion &&
    !isMentionReply &&
    !isInterest &&
    !isMilestone
  ) {
    return null;
  }

  const threadLink = isMilestone
    ? "/analytics"
    : notification.post_uid
      ? `/p/${notification.post_slug || notification.post_uid}`
      : null;

  const handleClick = () => {
    if (threadLink) navigate(threadLink);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex gap-3 py-3.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0 -mx-4 px-4 transition-colors",
        threadLink &&
          "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30",
      )}
    >
      {isMilestone ? (
        <div className="size-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-1">
          <Award className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
      ) : notification.actor_is_anonymous ? (
        <div className="shrink-0 mt-1">
          <UserAvatar
            src={undefined}
            name="Anonymous"
            className="size-9"
          />
        </div>
      ) : (
        <Link
          to={`/u/${notification.actor_username}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 mt-1"
        >
          <UserAvatar
            src={notification.actor_avatar}
            name={notification.actor_username}
            className="size-9"
          />
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
          {isMilestone ? (
            <span className="font-medium">Milestone Unlocked</span>
          ) : (
            <>
              <span className={cn(notification.actor_is_anonymous ? "" : "hover:underline")}>
                {notification.actor_is_anonymous ? "Anonymous" : notification.actor_username}
              </span>
              <span className="text-neutral-500 dark:text-neutral-400">
                {isUpvote && " upvoted your post"}
                {isReply && " replied to your question"}
                {isUpvoteReply && " upvoted your reply"}
                {isMentionQuestion && " mentioned you"}
                {isMentionReply && " mentioned you in a reply"}
                {isInterest && " is interested in your post"}
              </span>
            </>
          )}
        </p>

        {isMentionQuestion && notification.content && (
          <div className="mt-1.5 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg p-2.5">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">
              Question
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
              {notification.content}
            </p>
          </div>
        )}

        {isMentionReply && notification.content && (
          <div className="mt-1.5 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg p-2.5">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">
              Reply
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
              {notification.content}
            </p>
            {notification.question_content && (
              <div className="mt-1.5 pt-1.5 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">
                  On question
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {notification.question_content}
                </p>
              </div>
            )}
          </div>
        )}

        {isUpvoteReply && notification.content && (
          <div className="mt-1.5 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg p-2.5">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">
              Your reply
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
              {notification.content}
            </p>
            {notification.question_content && (
              <div className="mt-1.5 pt-1.5 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">
                  On question
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {notification.question_content}
                </p>
              </div>
            )}
          </div>
        )}

        {isReply && (
          <>
            {notification.question_content && (
              <div className="mt-1.5 pl-2.5 border-l-2 border-primary/30">
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">
                  On your question
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {notification.question_content}
                </p>
              </div>
            )}
            {notification.content && (
              <div className="mt-1.5 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg p-2.5">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
                  {notification.content}
                </p>
              </div>
            )}
          </>
        )}

        {isUpvote && notification.content && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 line-clamp-2">
            {notification.content}
          </p>
        )}

        {isInterest && notification.content && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 line-clamp-2 italic">
            "{notification.content}"
          </p>
        )}

        <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 flex items-center gap-1.5">
          {isMilestone ? (
            <Crosshair className="size-3 text-amber-500" />
          ) : isInterest ? (
            <HugeiconsIcon
              icon={UserMultiple02Icon}
              className="size-3 text-[var(--brand)]"
            />
          ) : isUpvote || isUpvoteReply ? (
            <HugeiconsIcon
              icon={CircleArrowUp01Icon}
              className="size-3 text-primary"
            />
          ) : (
            <HugeiconsIcon icon={Message01Icon} className="size-3" />
          )}
          {formatDistanceToNowStrict(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
}

function GroupedNotificationItem({ group }: { group: GroupedNotification }) {
  const navigate = useNavigate();
  const isUpvote = group.type === "upvote_post";
  const isUpvoteReply = group.type === "upvote_reply";
  const isInterest = group.type === "express_interest";

  const threadLink = group.post_uid ? `/p/${group.post_slug || group.post_uid}` : null;
  const first = group.actors[0];
  const restCount = group.actors.length - 1;

  const handleClick = () => {
    if (threadLink) navigate(threadLink);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex gap-3 py-3.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0 -mx-4 px-4 transition-colors",
        threadLink &&
          "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30",
      )}
    >
      <Avatars actors={group.actors} max={3} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
          <Link
            to={`/u/${first.username}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium hover:underline"
          >
            {first.username}
          </Link>
          {restCount > 0 && (
            <>
              <span className="text-neutral-500 dark:text-neutral-400">
                {restCount === 1 ? " and 1 other" : ` and ${restCount} others`}
              </span>
            </>
          )}
          <span className="text-neutral-500 dark:text-neutral-400">
            {isUpvote && " upvoted your post"}
            {isUpvoteReply && " upvoted your reply"}
            {isInterest && " is interested in your post"}
          </span>
        </p>

        {isUpvote && group.content && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 line-clamp-2">
            {group.content}
          </p>
        )}

        {isInterest && group.content && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 line-clamp-2 italic">
            "{group.content}"
          </p>
        )}

        <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 flex items-center gap-1.5">
          {isInterest ? (
            <HugeiconsIcon
              icon={UserMultiple02Icon}
              className="size-3 text-[var(--brand)]"
            />
          ) : (
            <HugeiconsIcon
              icon={CircleArrowUp01Icon}
              className="size-3 text-primary"
            />
          )}
          {formatDistanceToNowStrict(new Date(group.created_at), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
}

const GROUPABLE_TYPES = new Set([
  "upvote_post",
  "upvote_reply",
  "express_interest",
]);

function partitionNotifications(list: Notification[]) {
  const groupedMap = new Map<string, Notification[]>();
  const individual: Notification[] = [];

  for (const n of list) {
    if (GROUPABLE_TYPES.has(n.type)) {
      const key = `${n.type}::${n.post_uid}`;
      if (!groupedMap.has(key)) groupedMap.set(key, []);
      groupedMap.get(key)!.push(n);
    } else {
      individual.push(n);
    }
  }

  const groups: GroupedNotification[] = [];
  for (const items of groupedMap.values()) {
    const first = items[0];
    groups.push({
      key: `${first.uid}::group`,
      type: first.type,
      post_uid: first.post_uid,
      post_slug: first.post_slug,
      reference_uid: first.reference_uid,
      content: first.content,
      question_content: first.question_content ?? "",
      created_at: items.reduce(
        (latest, n) => (n.created_at > latest ? n.created_at : latest),
        items[0].created_at,
      ),
      actors: items.map((n) => ({
        username: n.actor_username,
        avatar: n.actor_avatar,
      })),
    });
  }

  groups.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return { groups, individual };
}

function filterNotifications(notifications: Notification[], tab: string) {
  switch (tab) {
    case "replies":
      return notifications.filter((n) => n.type === "reply_post");
    case "upvotes":
      return notifications.filter(
        (n) => n.type === "upvote_post" || n.type === "upvote_reply",
      );
    case "mentions":
      return notifications.filter(
        (n) => n.type === "mention_post" || n.type === "mention_reply",
      );
    case "interest":
      return notifications.filter((n) => n.type === "express_interest");
    default:
      return notifications;
  }
}

function countByType(notifications: Notification[], type: string): number {
  switch (type) {
    case "replies":
      return notifications.filter((n) => n.type === "reply_post").length;
    case "upvotes":
      return notifications.filter(
        (n) => n.type === "upvote_post" || n.type === "upvote_reply",
      ).length;
    case "mentions":
      return notifications.filter(
        (n) => n.type === "mention_post" || n.type === "mention_reply",
      ).length;
    case "interest":
      return notifications.filter((n) => n.type === "express_interest").length;
    default:
      return notifications.length;
  }
}

export default function Notifications() {
  const {
    data: notificationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteNotificationsQuery();
  const notifications = notificationsData ? notificationsData.pages.flat() : [];

  const { mutate: markRead } = useMarkNotificationsRead();

  useEffect(() => {
    if (notifications.some((n) => !n.is_read)) {
      markRead();
    }
  }, [notifications, markRead]);

  const [activeTab, setActiveTab] = useState("all");

  const filteredNotifications = useMemo(
    () => filterNotifications(notifications, activeTab),
    [notifications, activeTab],
  );

  const { groups, individual } = useMemo(
    () => partitionNotifications(filteredNotifications),
    [filteredNotifications],
  );

  const tabs = useMemo(() => {
    const all = [
      { id: "all", label: "All", count: countByType(notifications, "all") },
      {
        id: "replies",
        label: "Replies",
        count: countByType(notifications, "replies"),
      },
      {
        id: "upvotes",
        label: "Upvotes",
        count: countByType(notifications, "upvotes"),
      },
      {
        id: "mentions",
        label: "Mentions",
        count: countByType(notifications, "mentions"),
      },
      {
        id: "interest",
        label: "Interest",
        count: countByType(notifications, "interest"),
      },
    ];
    return all.filter((t) => t.count > 0 || t.id === "all");
  }, [notifications]);

  const fetchNextPageRef = useRef(fetchNextPage);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);

  /* eslint-disable react-hooks/refs */
  fetchNextPageRef.current = fetchNextPage;
  hasNextPageRef.current = hasNextPage;
  isFetchingNextPageRef.current = isFetchingNextPage;
  /* eslint-enable react-hooks/refs */

  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (
            entry.isIntersecting &&
            hasNextPageRef.current &&
            !isFetchingNextPageRef.current
          ) {
            fetchNextPageRef.current();
          }
        },
        { threshold: 0, rootMargin: "200px" },
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  const hasItems = groups.length > 0 || individual.length > 0;

  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 px-4 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0 text-balance">
          Activity
        </h1>
        <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance">
          Stay updated on your questions and replies
        </h2>
      </div>

      <div className="mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTab key={tab.id} value={tab.id}>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-500 dark:text-neutral-400">
                    {tab.count}
                  </span>
                )}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 px-4 overflow-hidden">
        {isLoading ? (
          <NotificationListSkeleton count={8} />
        ) : hasItems ? (
          <>
            {groups.map((g) => (
              <GroupedNotificationItem key={g.key} group={g} />
            ))}
            {individual.map((n) => (
              <NotificationItem key={n.uid} notification={n} />
            ))}
            {activeTab === "all" && hasNextPage && (
              <div
                ref={loadMoreCallbackRef}
                className="flex justify-center py-4 border-t border-neutral-100 dark:border-neutral-800 -mx-4 px-4"
              >
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-full w-full py-5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors gap-2 cursor-pointer"
                >
                  {isFetchingNextPage ? (
                    <>
                      <span className="inline-block animate-spin size-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-800 dark:border-t-neutral-200" />
                      Loading more...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={
              <HugeiconsIcon icon={InformationCircleIcon} className="size-8" />
            }
            title={`No ${activeTab === "all" ? "activity" : activeTab} yet`}
            description="Interactions with your posts will appear here"
          />
        )}
      </div>
    </PageTransition>
  );
}
