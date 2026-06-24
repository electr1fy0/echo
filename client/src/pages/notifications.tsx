import { useRef, useCallback, useMemo, useState } from "react";
import { useInfiniteNotificationsQuery } from "@/hooks/use-notifications";
import { HugeiconsIcon } from "@hugeicons/react";
import {
 Message01Icon,
 CircleArrowUp01Icon,
 InformationCircleIcon,
 UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import type { Notification } from "@/api/notifications";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeTime } from "@/lib/format-time";
import { NotificationListSkeleton } from "@/components/ui/skeletons";
import { Link } from "react-router";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/dashed-empty-state";

function NotificationItem({ notification }: { notification: Notification }) {
 const isUpvote = notification.type === "upvote_question";
 const isReply = notification.type === "reply_question";
 const isUpvoteReply = notification.type === "upvote_reply" || notification.type === "upvote_post";
 const isMentionQuestion = notification.type === "mention_question" || notification.type === "mention_post";
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
  : `/q/${notification.reference_uid}`;

  return (
  <div className="flex gap-3 py-3.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 -mx-4 px-4 transition-colors group">
  {isMilestone ? (
    <div className="size-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-1">
      <span className="text-lg">🎉</span>
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
  <Link to={threadLink} className="block">
  <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-snug">
  {isMilestone ? (
    <span className="font-medium">Milestone Unlocked 🎯</span>
  ) : (
    <>
      <span className=" hover:underline">
        {notification.actor_username}
      </span>
      <span className="text-neutral-500 dark:text-neutral-400">
        {isUpvote && " upvoted your question"}
        {isReply && " replied to your question"}
        {isUpvoteReply && " upvoted your reply"}
        {isMentionQuestion && " mentioned you"}
        {isMentionReply && " mentioned you in a reply"}
        {isInterest && " is interested in your post"}
      </span>
    </>
  )}
  </p>
 </Link>

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
  <span className="text-amber-500">🎯</span>
  ) : isInterest ? (
  <HugeiconsIcon icon={UserMultiple02Icon} className="size-3 text-[var(--brand)]" />
  ) : isUpvote || isUpvoteReply ? (
  <HugeiconsIcon
  icon={CircleArrowUp01Icon}
  className="size-3 text-primary"
  />
  ) : (
  <HugeiconsIcon icon={Message01Icon} className="size-3" />
  )}
  {formatRelativeTime(new Date(notification.created_at))}
  </span>
 </div>
 </div>
 );
}

function filterNotifications(notifications: Notification[], tab: string) {
  switch (tab) {
    case "replies":
      return notifications.filter((n) => n.type === "reply_question");
    case "upvotes":
      return notifications.filter(
        (n) =>
          n.type === "upvote_question" ||
          n.type === "upvote_reply" ||
          n.type === "upvote_post"
      );
    case "mentions":
      return notifications.filter(
        (n) =>
          n.type === "mention_question" ||
          n.type === "mention_post" ||
          n.type === "mention_reply"
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
      return notifications.filter((n) => n.type === "reply_question").length;
    case "upvotes":
      return notifications.filter(
        (n) =>
          n.type === "upvote_question" ||
          n.type === "upvote_reply" ||
          n.type === "upvote_post"
      ).length;
    case "mentions":
      return notifications.filter(
        (n) =>
          n.type === "mention_question" ||
          n.type === "mention_post" ||
          n.type === "mention_reply"
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

  const [activeTab, setActiveTab] = useState("all");

  const filteredNotifications = useMemo(
    () => filterNotifications(notifications, activeTab),
    [notifications, activeTab]
  );

  const tabs = useMemo(() => {
    const all = [
      { id: "all", label: "All", count: countByType(notifications, "all") },
      { id: "replies", label: "Replies", count: countByType(notifications, "replies") },
      { id: "upvotes", label: "Upvotes", count: countByType(notifications, "upvotes") },
      { id: "mentions", label: "Mentions", count: countByType(notifications, "mentions") },
      { id: "interest", label: "Interest", count: countByType(notifications, "interest") },
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
        { threshold: 0, rootMargin: "200px" }
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

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
        <Tabs tabs={tabs} selected={activeTab} onSelect={setActiveTab} />
      </div>

      <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 px-4 overflow-hidden">
        {isLoading ? (
          <NotificationListSkeleton count={8} />
        ) : filteredNotifications.length > 0 ? (
          <>
            {filteredNotifications.map((n) => (
              <NotificationItem key={n.uid} notification={n} />
            ))}
            {activeTab === "all" && hasNextPage && (
              <div ref={loadMoreCallbackRef} className="flex justify-center py-4 border-t border-neutral-100 dark:border-neutral-800 -mx-4 px-4">
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
            icon={<HugeiconsIcon icon={InformationCircleIcon} className="size-8" />}
            title={`No ${activeTab === "all" ? "activity" : activeTab} yet`}
            description="Interactions with your posts will appear here"
          />
        )}
      </div>
    </PageTransition>
  );
}
