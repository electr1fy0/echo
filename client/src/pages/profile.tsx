import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import {
  useInfiniteUserQuestionsQuery,
  useDeleteQuestion,
} from "@/hooks/use-questions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PencilEdit02Icon,
  MoreHorizontalIcon,
  Alert02Icon,
  Sun03Icon,
  Moon02Icon,
  Logout01Icon,
  ComputerIcon,
  Message02Icon,
  HelpCircleIcon,
  Mail01Icon,
  Link01Icon,
  Add01Icon,
  ArrowLeft02Icon,
} from "@hugeicons/core-free-icons";
import { Drawer, DrawerPopup, DrawerPanel, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog as EditDialog,
  DialogContent as EditDialogContent,
  DialogClose as EditDialogClose,
  DialogHeader as EditDialogHeader,
  DialogTitle as EditDialogTitle,
  DialogFooter as EditDialogFooter,
} from "@/components/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@/components/ui/otp-field";
import { useFetchProfile, useUpdateProfile, useEmailChange, useConfirmEmailChange } from "@/hooks/use-profile";
import { useDeleteAccount, useSignout } from "@/hooks/use-auth";
import type { User } from "@/types";
import { useListChambers } from "@/hooks/use-chamber";
import { CreateChamberDialog } from "@/components/chambers/create-chamber-dialog";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { handleApiError } from "@/lib/api-error";
import { toastManager } from "@/components/ui/toast";
import { ChamberPillSkeleton } from "@/components/ui/skeletons";
import { useTheme } from "next-themes";
import { useAccentTheme } from "@/hooks/use-accent-theme";
type AccentTheme =
  | "orange"
  | "blue"
  | "violet"
  | "rose"
  | "green"
  | "cyan"
  | "pink"
  | "red"
  | "lime";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { CropImageDialog } from "@/components/ui/crop-image-dialog";

import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/page-transition";
import { FluidGradientText } from "@/components/fluid-gradient-text";
import { DotGridSpotlight } from "@/components/dot-grid-spotlight";
import { LevelBadge } from "@/components/ui/level-badge";
import { BadgeDisplay } from "@/components/ui/badge-display";

const DYLAN_SEEDS = [
  "felix",
  "aria",
  "luna",
  "max",
  "zoe",
  "leo",
  "mia",
  "kai",
  "nova",
  "elsa",
  "oliver",
  "stella",
  "arlo",
  "ivy",
  "theo",
  "rose",
];

const HAIR_COLORS = [
  { hex: "000000", label: "Black" },
  { hex: "1d5dff", label: "Blue" },
  { hex: "ff543d", label: "Red" },
  { hex: "ffffff", label: "White" },
  { hex: "fff500", label: "Yellow" },
];

const BG_COLORS = [
  { hex: "619eff", label: "Blue" },
  { hex: "29e051", label: "Green" },
  { hex: "ffa6e6", label: "Pink" },
];

const SKIN_COLORS = [
  { hex: "ffd6c0", label: "Light" },
  { hex: "c26450", label: "Tan" },
];

function buildDiceBearUrl(
  seed: string,
  hair?: string,
  mood?: string,
  hairColor?: string,
  backgroundColor?: string,
  skinColor?: string,
) {
  const params = new URLSearchParams({ seed });
  if (hair) params.set("hair", hair);
  if (mood) params.set("mood", mood);
  if (hairColor) params.set("hairColor", hairColor);
  if (backgroundColor) params.set("backgroundColor", backgroundColor);
  if (skinColor) params.set("skinColor", skinColor);
  return `https://api.dicebear.com/10.x/dylan/svg?${params}`;
}

function parseDiceBearUrl(url: string) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("dicebear.com")) return null;
    const seed = u.searchParams.get("seed") || undefined;
    const hairColor = u.searchParams.get("hairColor") || undefined;
    const backgroundColor = u.searchParams.get("backgroundColor") || undefined;
    const skinColor = u.searchParams.get("skinColor") || undefined;
    const hair = u.searchParams.get("hair") || undefined;
    const mood = u.searchParams.get("mood") || undefined;
    return { seed, hairColor, backgroundColor, skinColor, hair, mood };
  } catch {
    return null;
  }
}

export default function Profile() {
  const {
    data: user,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
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
    refetch: refetchQn,
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
        { threshold: 0, rootMargin: "200px" },
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);
  const { mutate: deleteQuestion } = useDeleteQuestion();
  const { mutate: deleteAccount } = useDeleteAccount();
  const isMobile = useIsMobile();
  const { mutate: signout } = useSignout();
  const { theme, setTheme } = useTheme();
  const { accent, setAccent, themes } = useAccentTheme();
  const { start: startTour } = useOnboardingTour();
  const { upload: uploadImage, uploading: imageUploading } = useImageUpload();
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [avatarHair, _setAvatarHair] = useState("bangs");
  const [avatarMood, _setAvatarMood] = useState("happy");
  const [avatarHairColor, setAvatarHairColor] = useState("000000");
  const [avatarBgColor, setAvatarBgColor] = useState("619eff");
  const [avatarSkinColor, setAvatarSkinColor] = useState("ffd6c0");
  const [avatarSeed, setAvatarSeed] = useState("aria");
  const [editPage, setEditPage] = useState<"profile" | "avatar">("profile");

  useEffect(() => {
    const root = document.documentElement;
    const check = () => setIsDark(root.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  const [editForm, setEditForm] = useState<User>({
    username: "",
    email: "",
    bio: "",
    avatar: "",
    link: "",
    reputation: 0,
    answered: 0,
    posted: 0,
    dmEnabled: true,
  });
  const { mutate: sendOtp, isPending: isSendingOtp } = useEmailChange();
  const { mutate: confirmOtp, isPending: isConfirmingOtp } = useConfirmEmailChange();
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { data: chambers = [], isLoading: isChambersLoading } =
    useListChambers();
  const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(editForm, {
      onSuccess: () => {
        toastManager.add({ title: "Profile updated successfully", type: "success" });
        setIsEditOpen(false);
      },
      onError: (err) => {
        handleApiError(err, "Failed to update profile");
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
    reputation: 0,
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
      <EmptyState
        icon={<HugeiconsIcon icon={Alert02Icon} className="size-8" />}
        title="Failed to load profile"
        description="Something went wrong while loading your profile."
        action={
          <Button variant="outline" size="sm" onClick={() => refetchProfile()}>
            Try again
          </Button>
        }
        className="mt-20"
      />
    );
  }

  return (
    <PageTransition className="max-w-[40rem] w-full mt-4 space-y-0 pb-36 md:pb-16 relative">
      {isProfileLoading ? (
        <Skeleton className="h-28 w-auto mb-2 mx-4" />
      ) : (
        <div className="relative h-40 w-auto mb-4 mx-4 mt-4 overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800/60">
          <DotGridSpotlight
            dotColor={
              isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)"
            }
            activeDotColor={
              isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.16)"
            }
          />
          <FluidGradientText
            text={displayUser.username}
            svgViewBoxHeight={240}
          />
        </div>
      )}
      <div className="px-4">
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

            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (user) {
                    setEditForm(user);
                    setIsEditOpen(true);
                  }
                }}
              >
                <HugeiconsIcon
                  icon={PencilEdit02Icon}
                  className="mr-2 size-4"
                />
                Edit Profile
              </Button>
              <Drawer open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DrawerTrigger render={<Button variant="outline" size="icon-sm" />}>
                  <HugeiconsIcon
                    icon={MoreHorizontalIcon}
                    className="size-5"
                  />
                </DrawerTrigger>
                <DrawerPopup className="sm:max-w-[500px] sm:max-h-[80vh]">
                  <DrawerPanel className="space-y-5">
                    {/* Theme */}
                    <div className="space-y-3">
                      <span className="text-[10px] text-neutral-400 tracking-wide uppercase">
                        Theme
                      </span>
                      <div className="flex gap-1.5">
                        {[
                          {
                            key: "light" as const,
                            icon: Sun03Icon,
                            label: "Light",
                          },
                          {
                            key: "dark" as const,
                            icon: Moon02Icon,
                            label: "Dark",
                          },
                          {
                            key: "system" as const,
                            icon: ComputerIcon,
                            label: "System",
                          },
                        ].map((t) => (
                          <button
                            key={t.key}
                            onClick={() => setTheme(t.key)}
                            className={cn(
                              "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs border transition-all cursor-pointer",
                              theme === t.key
                                ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100"
                                : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700",
                            )}
                          >
                            <HugeiconsIcon icon={t.icon} className="size-3.5" />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent */}
                    <div className="space-y-3">
                      <span className="text-[10px] text-neutral-400 tracking-wide uppercase">
                        Accent
                      </span>
                      <div className="flex gap-3">
                        {(
                          [
                            "orange",
                            "blue",
                            "violet",
                            "rose",
                            "green",
                            "cyan",
                            "pink",
                            "red",
                            "lime",
                          ] as AccentTheme[]
                        ).map((t) => (
                          <button
                            key={t}
                            onClick={() => setAccent(t)}
                            className={cn(
                              "size-7 rounded-full transition-all cursor-pointer",
                              accent === t &&
                                "ring-2 ring-offset-2 ring-neutral-400 dark:ring-neutral-600",
                            )}
                            style={{ backgroundColor: themes[t].color }}
                            aria-label={themes[t].label}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

                    {/* Preferences */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <HugeiconsIcon
                          icon={Message02Icon}
                          className="size-4 text-neutral-400"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          Direct Messages
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={displayUser.dmEnabled}
                        onClick={() =>
                          updateProfile({
                            ...displayUser,
                            dmEnabled: !displayUser.dmEnabled,
                          })
                        }
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none",
                          displayUser.dmEnabled
                            ? "bg-neutral-900 dark:bg-neutral-100"
                            : "bg-neutral-200 dark:bg-neutral-700",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none block size-4 rounded-full shadow-sm ring-0 transition-transform",
                            displayUser.dmEnabled
                              ? "translate-x-4 bg-white dark:bg-neutral-900"
                              : "translate-x-0 bg-white dark:bg-neutral-300",
                          )}
                        />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        startTour();
                      }}
                      className="flex items-center gap-3 w-full py-1.5 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <HugeiconsIcon
                        icon={HelpCircleIcon}
                        className="size-4 text-neutral-400"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        Restart Tour
                      </span>
                    </button>

                    <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

                    {/* Account */}
                    <button
                      onClick={() => signout()}
                      className="flex items-center gap-3 w-full py-1.5 px-2 -mx-2 rounded-lg cursor-pointer text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>

                    <button
                      onClick={() => setIsDeleteOpen(true)}
                      className="flex items-center gap-3 w-full py-1.5 px-2 -mx-2 rounded-lg cursor-pointer text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <HugeiconsIcon icon={Alert02Icon} className="size-4" />
                      <span className="text-sm">Delete Account</span>
                    </button>
                  </DrawerPanel>
                </DrawerPopup>
              </Drawer>
            </div>
          </div>
          <div className="space-y-1 w-full">
            <h1 className="text-2xl text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              {displayUser.username}
              <LevelBadge reputation={displayUser.reputation} size="md" />
            </h1>
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
            <>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-md whitespace-pre-wrap">
                {displayUser.bio}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1">
                <HugeiconsIcon icon={Message02Icon} className="size-3.5" />
                <span>
                  DMs {displayUser.dmEnabled ? "enabled" : "disabled"}
                </span>
              </div>
            </>
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
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {displayUser.reputation}
                  </span>
                  <span className="text-xs text-neutral-500">Reputation</span>
                </div>
                <div className="flex flex-col">
                  <span className=" text-neutral-900 dark:text-neutral-100">
                    {displayUser.answered}
                  </span>
                  <span className="text-xs text-neutral-500">Answered</span>
                </div>
                <div className="flex flex-col">
                  <span className=" text-neutral-900 dark:text-neutral-100">
                    {questions.length}
                  </span>
                  <span className="text-xs text-neutral-500">Posted</span>
                </div>
              </>
            )}
          </div>
          <div className="pt-3">
            <BadgeDisplay badges={displayUser.badges ?? []} />
          </div>
        </div>
        <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 my-6" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
              Chambers I'm in
            </h3>
            <Button
              variant="outline"
              size="xs"
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
                  href={`/chambers/${chamber.name}`}
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
            <EmptyState title="No chambers joined yet" />
          )}
        </div>
        <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 my-6" />
        <div className="space-y-4">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
            Recent Activity
          </h3>
          {isQnLoading ? (
            <QuestionListSkeleton />
          ) : qnError ? (
            <EmptyState
              icon={<HugeiconsIcon icon={Alert02Icon} className="size-6" />}
              title="Failed to load activity"
              action={
                <Button variant="outline" size="sm" onClick={() => refetchQn()}>
                  Try again
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="border border-neutral-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden">
                <QuestionList
                  questions={questions}
                  onDelete={(id) => deleteQuestion(id)}
                  showChamberName
                />
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
          )}
        </div>
        {(() => {
          const editContent = (
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-[200%]"
                style={{
                  transform:
                    editPage === "avatar"
                      ? "translateX(-50%)"
                      : "translateX(0)",
                }}
              >
                {/* ───── Page 1: Profile ───── */}
                <div className="w-1/2">
                  <EditDialogHeader className="px-6 pt-6 pb-0">
                    <EditDialogTitle>Edit Profile</EditDialogTitle>
                  </EditDialogHeader>
                  {(() => {
                    const fields = (
                      <div className="px-6 space-y-5">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="username"
                            className="text-sm text-neutral-700 dark:text-neutral-300"
                          >
                            Username
                          </label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) =>
                              updateDraft({ username: e.target.value })
                            }
                            placeholder="username"
                            className="select-text"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="bio"
                            className="text-sm text-neutral-700 dark:text-neutral-300"
                          >
                            Bio
                          </label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => updateDraft({ bio: e.target.value })}
                            placeholder="Info about you"
                            className="select-text"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="link"
                            className="text-sm text-neutral-700 dark:text-neutral-300"
                          >
                            Link
                          </label>
                          <Input
                            id="link"
                            placeholder="https://example.com"
                            className="select-text"
                            value={editForm.link || ""}
                            onChange={(e) => updateDraft({ link: e.target.value })}
                          />
                        </div>

                        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">Email</p>
                              <p className="text-xs text-neutral-500 mt-0.5">{editForm.email}</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                setNewEmail("");
                                setOtp("");
                                setOtpSent(false);
                                setShowEmailChange(!showEmailChange);
                              }}
                            >
                              {showEmailChange ? "Cancel" : "Change"}
                            </Button>
                          </div>
                          {showEmailChange && (
                            <div className="space-y-3">
                              {!otpSent ? (
                                <>
                                  <Input
                                    type="email"
                                    placeholder="New email address"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    disabled={isSendingOtp}
                                  />
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="xs"
                                    disabled={isSendingOtp || !newEmail}
                                    onClick={() => {
                                      sendOtp(newEmail, {
                                        onSuccess: () => {
                                          setOtpSent(true);
                                          toastManager.add({ title: "OTP sent to your current email", type: "success" });
                                        },
                                        onError: (err) => {
                                          handleApiError(err, "Failed to send OTP");
                                        },
                                      });
                                    }}
                                  >
                                    {isSendingOtp ? "Sending..." : "Send OTP"}
                                  </Button>
                                </>
                              ) : (
                                <div className="space-y-4">
                                  <p className="text-xs text-neutral-500">OTP sent to your current email. Enter it below.</p>
                                  <div className="flex justify-center py-1">
                                    <OTPField
                                      length={6}
                                      validationType="numeric"
                                      onValueChange={(value: string) => {
                                        setOtp(value);
                                        if (value.length === 6 && !isConfirmingOtp) {
                                          confirmOtp(value, {
                                            onSuccess: () => {
                                              toastManager.add({ title: "Email updated successfully", type: "success" });
                                              setShowEmailChange(false);
                                              setOtpSent(false);
                                              refetchProfile();
                                            },
                                            onError: (err) => {
                                              handleApiError(err, "Failed to confirm email change");
                                            },
                                          });
                                        }
                                      }}
                                    >
                                      <OTPFieldInput aria-label="Character 1 of 6" />
                                      <OTPFieldInput aria-label="Character 2 of 6" />
                                      <OTPFieldInput aria-label="Character 3 of 6" />
                                      <OTPFieldSeparator />
                                      <OTPFieldInput aria-label="Character 4 of 6" />
                                      <OTPFieldInput aria-label="Character 5 of 6" />
                                      <OTPFieldInput aria-label="Character 6 of 6" />
                                    </OTPField>
                                  </div>
                                  <div className="flex justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOtpSent(false);
                                        setOtp("");
                                      }}
                                      className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    >
                                      Back
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (editForm.avatar) {
                              const parsed = parseDiceBearUrl(editForm.avatar);
                              if (parsed) {
                                if (parsed.seed) setAvatarSeed(parsed.seed);
                                if (parsed.hairColor)
                                  setAvatarHairColor(parsed.hairColor);
                                if (parsed.backgroundColor)
                                  setAvatarBgColor(parsed.backgroundColor);
                                if (parsed.skinColor)
                                  setAvatarSkinColor(parsed.skinColor);
                                if (parsed.hair) _setAvatarHair(parsed.hair);
                                if (parsed.mood) _setAvatarMood(parsed.mood);
                              }
                            } else {
                              setAvatarSeed(
                                DYLAN_SEEDS[
                                  Math.floor(Math.random() * DYLAN_SEEDS.length)
                                ],
                              );
                            }
                            setEditPage("avatar");
                          }}
                          className="flex items-center justify-between w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            {editForm.avatar ? (
                              <img
                                src={editForm.avatar}
                                className="size-10 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
                              />
                            ) : (
                              <div className="size-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center ring-1 ring-neutral-200 dark:ring-neutral-800">
                                <HugeiconsIcon
                                  icon={Add01Icon}
                                  className="size-4 text-neutral-400"
                                />
                              </div>
                            )}
                            <div className="text-left">
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Avatar
                              </span>
                              <p className="text-xs text-neutral-500">
                                Choose or upload an avatar
                              </p>
                            </div>
                          </div>
                          <HugeiconsIcon
                            icon={ArrowLeft02Icon}
                            className="size-4 text-neutral-400 rotate-180 group-hover:-translate-x-0.5 transition-transform"
                          />
                        </button>
                      </div>
                    );

                    const footer = (
                      <>
                        <CropImageDialog
                          open={!!cropImageSrc}
                          onOpenChange={() => setCropImageSrc(null)}
                          imageSrc={cropImageSrc || ""}
                          onCropComplete={async (blob) => {
                            const file = new File([blob], "avatar.jpg", {
                              type: "image/jpeg",
                            });
                            const url = await uploadImage(file);
                            if (url) updateDraft({ avatar: url });
                            setCropImageSrc(null);
                          }}
                        />
                        <EditDialogFooter className={cn("flex-row gap-2 px-6 pt-4", isMobile && "rounded-none", !isMobile && "pb-6")}>
                          <EditDialogClose
                            render={<Button variant="outline" className="flex-1" />}
                          >
                            Cancel
                          </EditDialogClose>
                          <Button variant="default" type="submit" className="flex-1">
                            Save Changes
                          </Button>
                        </EditDialogFooter>
                      </>
                    );

                    return (
                      <form
                        onSubmit={(e) => handleSubmit(e)}
                        className="space-y-5 pt-5"
                      >
                        {isMobile ? (
                          <>
                            {footer}
                            {fields}
                          </>
                        ) : (
                          <>
                            {fields}
                            {footer}
                          </>
                        )}
                      </form>
                    );
                  })()}
                </div>

                {/* ───── Page 2: Avatar Studio ───── */}
                <div className="w-1/2 flex flex-col max-h-[80vh]">
                  <div className="flex items-center gap-3 px-6 pt-6 pb-3">
                    <button
                      type="button"
                      onClick={() => setEditPage("profile")}
                      className="size-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer -ml-1.5"
                    >
                      <HugeiconsIcon
                        icon={ArrowLeft02Icon}
                        className="size-4 text-neutral-600 dark:text-neutral-400"
                      />
                    </button>
                    <EditDialogTitle>Choose Avatar</EditDialogTitle>
                    {editForm.avatar && (
                      <button
                        type="button"
                        onClick={() => updateDraft({ avatar: "" })}
                        className="ml-auto text-xs text-red-500 hover:text-red-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-modern">
                    <div className="flex flex-col items-center gap-4">
                      <div className="size-36 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <img
                          src={buildDiceBearUrl(
                            avatarSeed,
                            avatarHair,
                            avatarMood,
                            avatarHairColor,
                            avatarBgColor,
                            avatarSkinColor,
                          )}
                          alt="Preview"
                          className="size-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAvatarSeed(
                            DYLAN_SEEDS[
                              Math.floor(Math.random() * DYLAN_SEEDS.length)
                            ],
                          )
                        }
                        className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer underline underline-offset-2"
                      >
                        Shuffle face
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 sm:gap-6">
                      <div className="text-center">
                        <span className="text-[10px] text-neutral-400 tracking-wide block mb-1.5">
                          Hair
                        </span>
                        <div className="flex gap-2 justify-center">
                          {HAIR_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setAvatarHairColor(c.hex)}
                              className={cn(
                                "size-6 rounded-full border-2 transition-all cursor-pointer",
                                avatarHairColor === c.hex
                                  ? "border-neutral-900 dark:border-white scale-110 shadow-sm"
                                  : "border-neutral-200 dark:border-neutral-700 hover:scale-110",
                              )}
                              style={{ backgroundColor: `#${c.hex}` }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-neutral-400 tracking-wide block mb-1.5">
                          Skin
                        </span>
                        <div className="flex gap-2 justify-center">
                          {SKIN_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setAvatarSkinColor(c.hex)}
                              className={cn(
                                "size-6 rounded-full border-2 transition-all cursor-pointer",
                                avatarSkinColor === c.hex
                                  ? "border-neutral-900 dark:border-white scale-110 shadow-sm"
                                  : "border-neutral-200 dark:border-neutral-700 hover:scale-110",
                              )}
                              style={{ backgroundColor: `#${c.hex}` }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-neutral-400 tracking-wide block mb-1.5">
                          Bg
                        </span>
                        <div className="flex gap-2 justify-center">
                          {BG_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setAvatarBgColor(c.hex)}
                              className={cn(
                                "size-6 rounded-full border-2 transition-all cursor-pointer",
                                avatarBgColor === c.hex
                                  ? "border-neutral-900 dark:border-white scale-110 shadow-sm"
                                  : "border-neutral-200 dark:border-neutral-700 hover:scale-110",
                              )}
                              style={{ backgroundColor: `#${c.hex}` }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-center">
                      <div className="flex justify-center">
                        <label className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors w-fit">
                          {imageUploading ? (
                            <span className="inline-block size-3.5 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin" />
                          ) : (
                            <HugeiconsIcon
                              icon={Add01Icon}
                              className="size-3.5"
                            />
                          )}
                          {imageUploading
                            ? "Uploading..."
                            : "Choose from device"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={imageUploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () =>
                                setCropImageSrc(reader.result as string);
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                    <Button
                      type="button"
                      className="min-w-[100px]"
                      onClick={() => {
                        const url = buildDiceBearUrl(
                          avatarSeed,
                          avatarHair,
                          avatarMood,
                          avatarHairColor,
                          avatarBgColor,
                          avatarSkinColor,
                        );
                        updateDraft({ avatar: url });
                        setEditPage("profile");
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );

          const handleClose = (open: boolean) => {
            setIsEditOpen(open);
            if (!open) {
              setEditPage("profile");
              setShowEmailChange(false);
              setOtpSent(false);
              setNewEmail("");
              setOtp("");
            }
          };

          if (isMobile) {
            return (
              <Drawer open={isEditOpen} onOpenChange={handleClose}>
                <DrawerPopup className="p-0" showCloseButton={editPage === "profile"}>
                  {editContent}
                </DrawerPopup>
              </Drawer>
            );
          }

          return (
            <EditDialog open={isEditOpen} onOpenChange={handleClose}>
              <EditDialogContent
                className="sm:min-w-[420px] sm:max-w-[560px] overflow-hidden p-0"
                showCloseButton={editPage === "profile"}
              >
                {editContent}
              </EditDialogContent>
            </EditDialog>
          );
        })()}
        <CreateChamberDialog
          open={createChamberOpen}
          onOpenChange={setCreateChamberOpen}
        />
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-6">
              <p className="text-sm text-neutral-500">
                Are you sure you want to delete your account? This action cannot
                be undone. All your data will be permanently removed.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteAccount(undefined, {
                      onSuccess: () => {
                        toastManager.add({ title: "Account deleted successfully", type: "success" });
                        setIsDeleteOpen(false);
                      },
                      onError: (err) => {
                        handleApiError(err, "Failed to delete account");
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


      </div>
    </PageTransition>
  );
}
