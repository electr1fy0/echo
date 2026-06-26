import { useState } from "react";
import { useNavigate } from "react-router";
import { useConversations, useCreateConversation } from "@/hooks/use-dms";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { formatDistanceToNowStrict } from "date-fns";
import { handleApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const IMAGE_URL_RE = /https?:\/\/\S+\.(jpe?g|png|gif|webp|avif|bmp)(\?.*)?$/i;

function getPreviewText(preview: string | null): string {
  if (!preview) return "No messages yet";
  const lines = preview.split("\n").filter((l) => l.trim());
  const nonImageLines = lines.filter((l) => !IMAGE_URL_RE.test(l.trim()));
  if (nonImageLines.length === 0) return "Sent an image";
  return nonImageLines[0];
}

export default function DMsPage() {
  const { data: conversations, isLoading } = useConversations();
  const { mutate: startConversation, isPending } = useCreateConversation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  const handleStart = () => {
    if (!username.trim()) return;
    startConversation(username.trim(), {
      onSuccess: (conv) => {
        navigate(`/dm/${conv.uid}`);
        setUsername("");
      },
      onError: (err) => {
        handleApiError(err, "Failed to start conversation");
      },
    });
  };

  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 px-4 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0 text-balance">
          Messages
        </h1>
        <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance">
          Chat with other members
        </h2>
      </div>

      <div className="flex gap-2 mb-8">
        <Input
          placeholder="Enter a username to message..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleStart();
          }}
          className="text-sm"
        />
        <Button
          variant="default"
          onClick={handleStart}
          disabled={isPending || !username.trim()}
          className="shrink-0"
        >
          {isPending ? "..." : "Message"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations && conversations.length > 0 ? (
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-transparent rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {conversations.map((conv) => (
            <button
              key={conv.uid}
              onClick={() => navigate(`/dm/${conv.uid}`)}
              className="group flex items-center gap-3 w-full text-left p-4 hover:bg-[#FAFAFA] dark:hover:bg-[#222] transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <div className="relative shrink-0">
                <UserAvatar
                  src={conv.otherAvatar}
                  name={conv.otherUsername}
                  className="size-10 transition-transform duration-200 group-hover:scale-105"
                />
                {(conv.unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-red-500 border-2 border-white dark:border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm truncate",
                    (conv.unreadCount ?? 0) > 0
                      ? "text-neutral-900 dark:text-neutral-100 font-semibold"
                      : "text-neutral-900 dark:text-neutral-100",
                  )}>
                    {conv.otherUsername}
                  </span>
                  {conv.lastMessageAt && (
                    <span className="text-[10px] text-neutral-400 shrink-0 ml-2">
                      {formatDistanceToNowStrict(new Date(conv.lastMessageAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 truncate mt-0.5">
                  {getPreviewText(conv.lastMessagePreview)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<HugeiconsIcon icon={UserGroupIcon} className="size-8" />}
          title="No conversations yet"
          description="Enter a username above to start messaging"
        />
      )}
    </PageTransition>
  );
}
