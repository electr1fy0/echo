import { useState } from "react";
import { Link } from "react-router";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PreviewCard, PreviewCardTrigger, PreviewCardPopup } from "@/components/ui/preview-card";
import type { User } from "@/types";
import { LevelBadge } from "@/components/ui/level-badge";
import { useFetchPublicProfile, useFollowUser, useUnfollowUser } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { Button } from "@/components/ui/button";

interface UserPreviewCardProps {
  user: User;
  children: React.ReactNode;
}

function UserPreviewCard({ user, children }: UserPreviewCardProps) {
  const { data: fetchedUser } = useFetchPublicProfile(user.username);
  const { data: currentUser } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { mutate: doFollow, isPending: isFollowPending } = useFollowUser();
  const { mutate: doUnfollow, isPending: isUnfollowPending } = useUnfollowUser();

  const profile = fetchedUser ?? user;
  const isPending = isFollowPending || isUnfollowPending;
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const isFollowing = optimistic ?? profile.isFollowing ?? false;

  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <PreviewCard>
      <PreviewCardTrigger render={children as React.ReactElement} />
      <PreviewCardPopup className="w-52 p-3 block">
        <div className="flex items-start gap-2.5">
          <UserAvatar
            src={profile.avatar}
            name={profile.username}
            className="size-9 shrink-0 mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <Link
              to={`/u/${profile.username}`}
              className="text-sm font-semibold text-foreground hover:underline line-clamp-1 flex items-center gap-1.5"
            >
              {profile.username}
              <LevelBadge reputation={profile.reputation ?? 0} size="sm" />
            </Link>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{profile.reputation ?? 0}</span> rep
              </span>
              <span>·</span>
              <span>
                <span className="font-medium text-foreground">{profile.followersCount ?? 0}</span> followers
              </span>
            </div>
            {currentUser && !isOwnProfile && (
              <Button
                variant={isFollowing ? "default" : "outline"}
                size="sm"
                className="rounded-full mt-2 h-7 text-xs"
                disabled={isPending}
                onClick={() => {
                  if (isFollowing) {
                    setOptimistic(false);
                    doUnfollow(profile.username);
                  } else {
                    setOptimistic(true);
                    doFollow(profile.username);
                  }
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
            {!currentUser && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full mt-2 h-7 text-xs"
                onClick={() => openAuthModal("signin")}
              >
                Follow
              </Button>
            )}
          </div>
        </div>
      </PreviewCardPopup>
    </PreviewCard>
  );
}

export { UserPreviewCard };
