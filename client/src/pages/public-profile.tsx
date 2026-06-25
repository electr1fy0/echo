import { useRef, useCallback, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useFetchPublicProfile, useFollowUser, useUnfollowUser } from "@/hooks/use-profile";
import { useInfiniteQuestionsQuery } from "@/hooks/use-questions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon, Message01Icon } from "@hugeicons/core-free-icons";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import { ProfileSkeleton } from "@/components/ui/skeletons";
import { PageTransition } from "@/components/page-transition";
import { FluidGradientText } from "@/components/fluid-gradient-text";
import { DotGridSpotlight } from "@/components/dot-grid-spotlight";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { track } from "@/lib/analytics";
import { useCreateConversation } from "@/hooks/use-dms";
import { handleApiError } from "@/lib/api-error";
import { LevelBadge } from "@/components/ui/level-badge";
import { BadgeDisplay } from "@/components/ui/badge-display";

function FollowButton({ username, isFollowing: initial }: { username: string; isFollowing?: boolean }) {
  const { data: currentUser } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { mutate: doFollow, isPending: isFollowPending } = useFollowUser();
  const { mutate: doUnfollow, isPending: isUnfollowPending } = useUnfollowUser();
  const [optimistic, setOptimistic] = useState(initial ?? false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    if (!initialLoaded && initial !== undefined) {
      setOptimistic(initial);
      setInitialLoaded(true);
    }
  }, [initial, initialLoaded]);

  const isPending = isFollowPending || isUnfollowPending;

  if (!currentUser) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => openAuthModal("signin")}
      >
        Follow
      </Button>
    );
  }

  return (
    <Button
      variant={optimistic ? "default" : "outline"}
      size="sm"
      className="rounded-full"
      disabled={isPending}
      onClick={() => {
        if (optimistic) {
          setOptimistic(false);
          doUnfollow(username);
        } else {
          setOptimistic(true);
          doFollow(username);
        }
      }}
    >
      {optimistic ? "Following" : "Follow"}
    </Button>
  );
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { data: currentUser } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { mutate: startConversation, isPending } = useCreateConversation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (username) {
      track("profile_view", { target: username });
    }
  }, [username]);

  useEffect(() => {
    const root = document.documentElement;
    const check = () => setIsDark(root.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const {
    data: user,
    isLoading: isProfileLoading,
    error: profileError,
  } = useFetchPublicProfile(username);

  const {
    data: qnData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isQnLoading,
  } = useInfiniteQuestionsQuery(undefined, undefined, undefined, username);
  const questions = qnData ? qnData.pages.flat() : [];

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

  if (isProfileLoading) {
    return <ProfileSkeleton />;
  }

  if (profileError || !user) {
    return (
      <div className="mt-20 text-sm text-red-500 px-4">Profile not found</div>
    );
  }
  const resolvedLink = (() => {
    const raw = (user.link || "").trim();
    if (!raw) return null;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
      return raw;
    }
    return `https://${raw}`;
  })();

  return (
    <PageTransition className="max-w-[40rem] w-full mt-4 space-y-0 pb-36 md:pb-16 relative">
      <div className="relative h-40 w-auto mb-4 mx-4 mt-4 overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800/60">
        <DotGridSpotlight
          dotColor={
            isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)"
          }
          activeDotColor={
            isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.16)"
          }
        />
        <FluidGradientText text={user.username} svgViewBoxHeight={240} />
      </div>
      <div className="px-4">
        <div className="flex flex-col items-start gap-4">
          <div className="flex w-full justify-between items-start">
            <UserAvatar
              src={user.avatar}
              name={user.username}
              className="size-24"
            />
            {currentUser?.username !== username && (
              <div className="flex gap-2">
                <FollowButton
                  username={username!}
                  isFollowing={user.isFollowing}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={isPending}
                  onClick={() => {
                    if (!currentUser) {
                      openAuthModal("signin");
                      return;
                    }
                    startConversation(username!, {
                      onSuccess: (conv) => navigate(`/dm/${conv.uid}`),
                      onError: (err) =>
                        handleApiError(err, "Cannot start conversation"),
                    });
                  }}
                >
                  <HugeiconsIcon icon={Message01Icon} className="mr-1.5 size-4" />
                  Message
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              {user.username}
              <LevelBadge reputation={user.reputation ?? 0} size="md" />
            </h1>
            <div className="flex flex-col gap-1 text-neutral-500 text-sm">
              {resolvedLink && (
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Link01Icon} className="size-4" />
                  <a
                    href={resolvedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-foreground transition-colors"
                  >
                    {user.link}
                  </a>
                </div>
              )}
            </div>
          </div>

          {user.bio && (
            <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-md whitespace-pre-wrap">
              {user.bio}
            </p>
          )}

          <div className="flex gap-6 pt-2">
            <div className="flex flex-col">
              <span className="text-neutral-900 dark:text-neutral-100">
                {user.reputation ?? 0}
              </span>
              <span className="text-xs text-neutral-500">Reputation</span>
            </div>
            <div className="flex flex-col">
              <span className=" text-neutral-900 dark:text-neutral-100">
                {user.answered}
              </span>
              <span className="text-xs text-neutral-500">Answered</span>
            </div>
            <div className="flex flex-col">
              <span className=" text-neutral-900 dark:text-neutral-100">
                {user.posted}
              </span>
              <span className="text-xs text-neutral-500">Posted</span>
            </div>
            <div className="flex flex-col">
              <span className="text-neutral-900 dark:text-neutral-100">
                {user.followersCount ?? 0}
              </span>
              <span className="text-xs text-neutral-500">Followers</span>
            </div>
            <div className="flex flex-col">
              <span className=" text-neutral-900 dark:text-neutral-100">
                {user.followingCount ?? 0}
              </span>
              <span className="text-xs text-neutral-500">Following</span>
            </div>
          </div>
          <div className="pt-3">
            <BadgeDisplay badges={user.badges ?? []} />
          </div>
        </div>

        <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 my-6" />

        <div className="space-y-4">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
            Questions
          </h3>
          {isQnLoading ? (
            <QuestionListSkeleton />
          ) : questions.length > 0 ? (
            <div className="space-y-4">
              <div className="border border-neutral-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden">
                <QuestionList questions={questions} showChamberName />
              </div>
              {hasNextPage && (
                <div
                  ref={loadMoreCallbackRef}
                  className="flex justify-center pt-4"
                >
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full"
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
            </div>
          ) : (
            <EmptyState title="No questions posted yet" />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
