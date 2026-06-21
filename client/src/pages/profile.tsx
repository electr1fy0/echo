import React, { useMemo, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import {
  useInfiniteUserQuestionsQuery,
  useDeleteQuestion,
} from "@/hooks/use-questions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  PencilEdit02Icon,
  Add01Icon,
  Link01Icon,
  MoreHorizontalIcon,
  Alert02Icon,
  Sun03Icon,
  Moon02Icon,
  Logout01Icon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFetchProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useDeleteAccount, useSignout } from "@/hooks/use-auth";
import type { User } from "@/types";
import { useListChambers } from "@/hooks/use-chamber";
import { CreateChamberDialog } from "@/components/chambers/create-chamber-dialog";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { toast } from "@/lib/toast";
import { ChamberPillSkeleton } from "@/components/ui/skeletons";
import { useTheme } from "@/hooks/use-theme";

import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/page-transition";

export default function Profile() {
  const {
    data: user,
    isLoading: isProfileLoading,
    error: profileError,
  } = useFetchProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [createChamberOpen, setCreateChamberOpen] = useState(false);
  const {
    data: qnData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isQnLoading,
    error: qnError,
  } = useInfiniteUserQuestionsQuery();
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
        { threshold: 0, rootMargin: "200px" }
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);
  const { mutate: deleteQuestion } = useDeleteQuestion();
  const { mutate: deleteAccount } = useDeleteAccount();
  const { mutate: signout } = useSignout();
  const { setTheme } = useTheme();
  const [editForm, setEditForm] = useState<User>({
    username: "",
    email: "",
    bio: "",
    avatar: "",
    link: "",
    answered: 0,
    posted: 0,
  });
  const { data: chambers = [], isLoading: isChambersLoading } =
    useListChambers();
  const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(editForm, {
      onSuccess: () => {
        toast.success("Profile updated successfully");
        setIsEditOpen(false);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to update profile",
        );
      },
    });
  };
  const updateDraft = (fields: Partial<User>) => {
    setEditForm((prev) => {
      return { ...prev, ...fields };
    });
  };

  const displayUser = user || {
    username: "",
    email: "",
    bio: "",
    avatar: "",
    link: "",
    answered: 0,
    posted: 0,
  };
  const resolvedLink = useMemo(() => {
    const raw = (displayUser.link || "").trim();
    if (!raw) return null;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
      return raw;
    }
    return `https://${raw}`;
  }, [displayUser.link]);

  if (profileError) {
    return (
      <div className="mt-20 text-sm text-red-500">Failed to load profile</div>
    );
  }

  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 space-y-8 pb-36 md:pb-16 relative px-4">
      <div className="flex flex-col items-start gap-4">
        <div className="flex w-full justify-between items-start">
          {isProfileLoading ? (
            <Skeleton className="size-24 rounded-full" />
          ) : (
            <UserAvatar
              src={displayUser.avatar}
              name={displayUser.username}
              className="size-24"
            />
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                if (user) {
                  setEditForm(user);
                  setIsEditOpen(true);
                }
              }}
            >
              <HugeiconsIcon icon={PencilEdit02Icon} className="mr-2 size-4" />
              Edit Profile
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-full"
                  >
                    <HugeiconsIcon
                      icon={MoreHorizontalIcon}
                      className="size-5"
                    />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <HugeiconsIcon icon={Sun03Icon} className="mr-2 size-4" />{" "}
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <HugeiconsIcon icon={Moon02Icon} className="mr-2 size-4" />{" "}
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <HugeiconsIcon
                      icon={ComputerIcon}
                      className="mr-2 size-4"
                    />{" "}
                    System
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => signout()}
                    className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
                  >
                    <HugeiconsIcon
                      icon={Logout01Icon}
                      className="mr-2 size-4"
                    />
                    Sign out
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    <HugeiconsIcon icon={Alert02Icon} className="mr-2 size-4" />
                    Delete Account...
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="space-y-1 w-full">
          {isProfileLoading ? (
            <Skeleton className="h-8 w-48 mb-2" />
          ) : (
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {displayUser.username}
            </h1>
          )}

          <div className="flex flex-col gap-1 text-neutral-500 text-sm">
            {isProfileLoading ? (
              <>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Mail01Icon} className="size-4" />
                  <span>{displayUser.email}</span>
                </div>
                {resolvedLink && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Link01Icon} className="size-4" />
                    <a
                      href={resolvedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-foreground transition-colors"
                    >
                      {displayUser.link}
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {isProfileLoading ? (
          <div className="w-full max-w-md pt-1">
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-md whitespace-pre-wrap">
            {displayUser.bio}
          </p>
        )}

        <div className="flex gap-6 pt-2">
          {isProfileLoading ? (
            <>
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {displayUser.answered}
                </span>
                <span className="text-xs text-neutral-500">Answered</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {questions.length}
                </span>
                <span className="text-xs text-neutral-500">Posted</span>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
            Chambers I'm in
          </h3>
          <Button
            variant="outline"
            size="default"
            className="h-7 text-xs gap-1 hover:text-neutral-900 dark:hover:text-neutral-100"
            onClick={() => setCreateChamberOpen(true)}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3" />
            Create Chamber
          </Button>
        </div>
        {isChambersLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <ChamberPillSkeleton key={i} />
            ))}
          </div>
        ) : JOINED_CHAMBERS.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {JOINED_CHAMBERS.map((chamber, i) => (
              <a
                key={chamber.uid || i}
                href={`/chamber/${chamber.uid}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div
                  className={cn(
                    "size-4 rounded-md",
                    CHAMBER_COLORS[
                      (chamber.colorIndex || 0) % CHAMBER_COLORS.length
                    ],
                  )}
                />
                <span className="text-sm text-neutral-900 dark:text-neutral-100">
                  {chamber.name}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No chambers joined yet.</p>
        )}
      </div>
      <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />
      <div className="space-y-4">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
          Recent Activity
        </h3>
        {isQnLoading ? (
          <QuestionListSkeleton count={3} />
        ) : qnError ? (
          <p className="text-red-500 text-sm">Failed to load activity</p>
        ) : (
          <div className="space-y-4">
            <QuestionList
              questions={questions}
              onDelete={(id) => deleteQuestion(id)}
            />
            {hasNextPage && (
              <div ref={loadMoreCallbackRef} className="flex justify-center pt-4">
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
          </div>
        )}
      </div>
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <form onSubmit={(e) => handleSubmit(e)} className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  value={editForm.username}
                  onChange={(e) => {
                    updateDraft({ username: e.target.value });
                  }}
                  placeholder="username"
                  className="select-text"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => {
                    updateDraft({ bio: e.target.value });
                  }}
                  placeholder="Info about you"
                  className="h-24 select-text"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="link" className="text-sm font-medium">
                  Link
                </label>
                <Input
                  id="link"
                  placeholder="https://example.com"
                  className="select-text"
                  value={editForm.link || ""}
                  onChange={(e) => {
                    updateDraft({ link: e.target.value });
                  }}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="avatar" className="text-sm font-medium">
                  Avatar URL
                </label>
                <Input
                  id="avatar"
                  className="select-text"
                  value={editForm.avatar}
                  placeholder="URL to fetch your avatar"
                  onChange={(e) => {
                    updateDraft({ avatar: e.target.value });
                  }}
                />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      <CreateChamberDialog
        open={createChamberOpen}
        onOpenChange={setCreateChamberOpen}
      />
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-neutral-500">
              Are you sure you want to delete your account? This action cannot
              be undone. All your data will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteAccount(undefined, {
                    onSuccess: () => {
                      toast.success("Account deleted successfully");
                      setIsDeleteOpen(false);
                    },
                    onError: () => {
                      toast.error("Failed to delete account");
                    },
                  });
                }}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
