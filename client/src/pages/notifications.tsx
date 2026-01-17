import { useState } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message01Icon, HelpCircleIcon } from "@hugeicons/core-free-icons";

type Tab = "replies" | "requests";

type ReplyNotification = {
  id: string;
  questionContent: string;
  replyContent: string;
  replierName: string;
  replierAvatar: string;
  timeAgo: string;
};

type RequestNotification = {
  id: string;
  questionContent: string;
  requesterName: string;
  requesterAvatar: string;
  timeAgo: string;
};

const MOCK_REPLIES: ReplyNotification[] = [
  {
    id: "1",
    questionContent: "Why do cats always land on their feet?",
    replyContent:
      "It's called the righting reflex! Cats have a flexible spine and no collarbone.",
    replierName: "Sarah",
    replierAvatar: "https://i.pravatar.cc/40?img=1",
    timeAgo: "2h ago",
  },
  {
    id: "2",
    questionContent: "What is the best way to learn React?",
    replyContent:
      "Start with the official docs, then build projects. That's the best combo.",
    replierName: "Mike",
    replierAvatar: "https://i.pravatar.cc/40?img=2",
    timeAgo: "5h ago",
  },
  {
    id: "3",
    questionContent: "How does the event loop work in JavaScript?",
    replyContent:
      "Check out the talk by Philip Roberts - it explains everything visually.",
    replierName: "Alex",
    replierAvatar: "https://i.pravatar.cc/40?img=3",
    timeAgo: "1d ago",
  },
];

const MOCK_REQUESTS: RequestNotification[] = [
  {
    id: "1",
    questionContent: "Best practices for accessible web design?",
    requesterName: "Jordan",
    requesterAvatar: "https://i.pravatar.cc/40?img=4",
    timeAgo: "30m ago",
  },
  {
    id: "2",
    questionContent: "Why is TypeScript becoming so popular?",
    requesterName: "Taylor",
    requesterAvatar: "https://i.pravatar.cc/40?img=5",
    timeAgo: "3h ago",
  },
];

function ReplyNotificationItem({
  notification,
}: {
  notification: ReplyNotification;
}) {
  return (
    <div className="flex gap-3 py-4 border-b border-neutral-200 dark:border-neutral-800">
      <img
        src={notification.replierAvatar}
        alt={notification.replierName}
        className="size-10 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 dark:text-neutral-100">
          <span className="font-medium">{notification.replierName}</span>
          <span className="text-neutral-500 dark:text-neutral-400">
            {" "}
            replied to your question
          </span>
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
          {notification.questionContent}
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 line-clamp-2">
          {notification.replyContent}
        </p>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 block">
          {notification.timeAgo}
        </span>
      </div>
    </div>
  );
}

function RequestNotificationItem({
  notification,
}: {
  notification: RequestNotification;
}) {
  return (
    <div className="flex gap-3 py-4 border-b border-neutral-200 dark:border-neutral-800">
      <img
        src={notification.requesterAvatar}
        alt={notification.requesterName}
        className="size-10 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 dark:text-neutral-100">
          <span className="font-medium">{notification.requesterName}</span>
          <span className="text-neutral-500 dark:text-neutral-400">
            {" "}
            wants you to answer
          </span>
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 line-clamp-2">
          "{notification.questionContent}"
        </p>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 block">
          {notification.timeAgo}
        </span>
      </div>
    </div>
  );
}

export function Notifications() {
  const [activeTab, setActiveTab] = useState<Tab>("replies");

  return (
    <div className="max-w-xl w-full mt-40 space-y-6 mb-40 relative px-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-lg  text-neutral-900 dark:text-neutral-100">
          Activity
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0 ">
          Stay updated on your questions and requests
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
        <button
          onClick={() => setActiveTab("replies")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
            activeTab === "replies"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300",
          )}
        >
          <HugeiconsIcon icon={Message01Icon} className="size-4" />
          Replies
          {MOCK_REPLIES.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
              {MOCK_REPLIES.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
            activeTab === "requests"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300",
          )}
        >
          <HugeiconsIcon icon={HelpCircleIcon} className="size-4" />
          Requests
          {MOCK_REQUESTS.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
              {MOCK_REQUESTS.length}
            </span>
          )}
        </button>
      </div>

      <div>
        {activeTab === "replies" ? (
          MOCK_REPLIES.length > 0 ? (
            <div>
              {MOCK_REPLIES.map((notification) => (
                <ReplyNotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
              <HugeiconsIcon
                icon={Message01Icon}
                className="size-10 opacity-20 mb-2"
              />
              <p className="text-sm">No replies yet</p>
            </div>
          )
        ) : MOCK_REQUESTS.length > 0 ? (
          <div>
            {MOCK_REQUESTS.map((notification) => (
              <RequestNotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <HugeiconsIcon
              icon={HelpCircleIcon}
              className="size-10 opacity-20 mb-2"
            />
            <p className="text-sm">No requests yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
