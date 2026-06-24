import { Link } from "react-router";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PreviewCard, PreviewCardTrigger, PreviewCardPopup } from "@/components/ui/preview-card";
import type { User } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon } from "@hugeicons/core-free-icons";
import { LevelBadge } from "@/components/ui/level-badge";

interface UserPreviewCardProps {
  user: User;
  children: React.ReactNode;
}

function UserPreviewCard({ user, children }: UserPreviewCardProps) {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={children as React.ReactElement} />
      <PreviewCardPopup className="w-56">
        <div className="relative">
          <div className="h-16 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700" />
          <div className="px-4 pb-4">
            <div className="-mt-6 mb-2">
              <UserAvatar
                src={user.avatar}
                name={user.username}
                className="size-12 ring-2 ring-background"
              />
            </div>
            <Link
              to={`/u/${user.username}`}
              className="text-sm font-semibold text-foreground hover:underline line-clamp-1 flex items-center gap-1.5"
            >
              {user.username}
              <LevelBadge reputation={user.reputation ?? 0} size="sm" />
            </Link>
            {user.bio && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {user.bio}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{user.reputation ?? 0}</span> rep
              </span>
              <span>
                <span className="font-medium text-foreground">{user.posted}</span> posted
              </span>
              <span>
                <span className="font-medium text-foreground">{user.answered}</span> answered
              </span>
            </div>
            {user.link && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <HugeiconsIcon icon={Link01Icon} className="size-3 shrink-0" />
                <span className="truncate">{user.link}</span>
              </div>
            )}
          </div>
        </div>
      </PreviewCardPopup>
    </PreviewCard>
  );
}

export { UserPreviewCard };
