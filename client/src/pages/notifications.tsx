import { useNotificationsQuery } from "@/hooks/use-notifications";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message01Icon, ArrowUp01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import type { Notification } from "@/api/notifications";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeTime } from "@/lib/format-time";
function NotificationItem({ notification }: { notification: Notification }) {
  const isUpvote = notification.type === "upvote_question";
  const isReply = notification.type === "reply_question";
  const isUpvoteReply = notification.type === "upvote_reply";
  if (!isUpvote && !isReply && !isUpvoteReply) return null;
  return (
    <div className="flex gap-4 py-4 border-b border-neutral-200 dark:border-neutral-800 last:border-0">
      <UserAvatar
        src={notification.actor_avatar}
        name={notification.actor_username}
        className="size-10 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 dark:text-neutral-100">
          <span className="font-semibold">{notification.actor_username}</span>
          <span className="text-neutral-500 dark:text-neutral-400">
            {isUpvote && " upvoted your question"}
            {isReply && " replied to your question"}
            {isUpvoteReply && " upvoted your reply"}
          </span>
        </p>
        {notification.content && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2">
            {notification.content}
          </p>
        )}
        <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 flex items-center gap-1.5">
          {(isUpvote || isUpvoteReply) ? (
            <HugeiconsIcon icon={ArrowUp01Icon} className="size-3 text-orange-500" />
          ) : (
            <HugeiconsIcon icon={Message01Icon} className="size-3 text-blue-500" />
          )}
          {formatRelativeTime(new Date(notification.created_at))}
        </span>
      </div>
    </div>
  );
}
export function Notifications() {
  const { data: notifications = [], isLoading } = useNotificationsQuery();
  return (
    <div className="max-w-[40rem] w-full mt-32 space-y-6 mb-40 relative px-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Activity
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Stay updated on your questions and replies
        </p>
      </div>
      <div className="bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 px-4">
        {isLoading ? (
          <div className="py-12 text-center text-neutral-500 text-sm">Loading activity...</div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => <NotificationItem key={n.uid} notification={n} />)
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
    </div>
  );
}
