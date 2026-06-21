import { useRef, useCallback } from "react";
import { useInfiniteNotificationsQuery } from "@/hooks/use-notifications";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message01Icon,
  CircleArrowUp01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import type { Notification } from "@/api/notifications";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeTime } from "@/lib/format-time";
import { NotificationListSkeleton } from "@/components/ui/skeletons";
import { Link } from "react-router";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";

function NotificationItem({ notification }: { notification: Notification }) {
  const isUpvote = notification.type === "upvote_question";
  const isReply = notification.type === "reply_question";
  const isUpvoteReply = notification.type === "upvote_reply";
  const isMentionQuestion = notification.type === "mention_question";
  const isMentionReply = notification.type === "mention_reply";

  if (
    !isUpvote &&
    !isReply &&
    !isUpvoteReply &&
    !isMentionQuestion &&
    !isMentionReply
  ) {
    return null;
  }

  return (
    <div className="flex gap-4 py-4 border-b border-neutral-200 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 -mx-4 px-4 transition-colors group">
      <Link
        to={`/u/${notification.actor_username}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        <UserAvatar
          src={notification.actor_avatar}
          name={notification.actor_username}
          className="size-10"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-neutral-900 dark:text-neutral-100">
            <Link
              to={`/u/${notification.actor_username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold hover:underline"
            >
              {notification.actor_username}
            </Link>
            <span className="text-neutral-500 dark:text-neutral-400">
              {isUpvote && " upvoted your question"}
              {isReply && " replied to your question"}
              {isUpvoteReply && " upvoted your reply"}
              {isMentionQuestion && " mentioned you in a question"}
              {isMentionReply && " mentioned you in a reply"}
            </span>
          </p>
        </div>

        {isMentionQuestion && notification.content && (
          <div className="mt-2 bg-neutral-100 dark:bg-neutral-800/70 rounded-lg p-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Question
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
              {notification.content}
            </p>
          </div>
        )}

        {isUpvoteReply && notification.content && (
          <div className="mt-2 bg-neutral-100 dark:bg-neutral-800/70 rounded-lg p-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Your reply
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
              {notification.content}
            </p>
            {notification.question_content && (
              <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  On question
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {notification.question_content}
                </p>
              </div>
            )}
          </div>
        )}

        {isMentionReply && notification.content && (
          <div className="mt-2 bg-neutral-100 dark:bg-neutral-800/70 rounded-lg p-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Reply
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
              {notification.content}
            </p>
            {notification.question_content && (
              <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
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
              <div className="mt-2 pl-3 border-l-2 border-primary/30">
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">
                  On your question
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {notification.question_content}
                </p>
              </div>
            )}
            {notification.content && (
              <div className="mt-2 bg-neutral-100 dark:bg-neutral-800/70 rounded-lg p-3">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
                  {notification.content}
                </p>
              </div>
            )}
          </>
        )}

        {isUpvote && notification.content && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 line-clamp-2">
            {notification.content}
          </p>
        )}

        <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 flex items-center gap-1.5">
          {isUpvote || isUpvoteReply ? (
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

export default function Notifications() {
  const {
    data: notificationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteNotificationsQuery();
  const notifications = notificationsData ? notificationsData.pages.flat() : [];

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
    <PageTransition className="max-w-160 w-full md:mt-24 mt-16 space-y-6 pb-36 md:pb-16 relative px-4">
      <div>
        <h1 className="text-lg text-neutral-900 dark:text-neutral-100">
          Activity
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Stay updated on your questions and replies
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 px-4 overflow-hidden">
        {isLoading ? (
          <NotificationListSkeleton count={8} />
        ) : notifications.length > 0 ? (
          <>
            {notifications.map((n) => (
              <NotificationItem key={n.uid} notification={n} />
            ))}
            {hasNextPage && (
              <div ref={loadMoreCallbackRef} className="flex justify-center py-4 border-t border-neutral-200 dark:border-neutral-800 -mx-4 px-4">
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
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              className="size-10 opacity-20 mb-3"
            />
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs mt-1">Interactions will appear here</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
