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
} from "@hugeicons/core-free-icons";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { useAccentTheme } from "@/hooks/use-accent-theme";
type AccentTheme = "orange" | "blue" | "violet" | "rose" | "green";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { CropImageDialog } from "@/components/ui/crop-image-dialog";

import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/page-transition";
import { FluidGradientText } from "@/components/fluid-gradient-text";

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
  const { theme, setTheme } = useTheme();
  const { accent, setAccent, themes } = useAccentTheme();
  const { start: startTour } = useOnboardingTour();
  const { upload: uploadImage, uploading: imageUploading } = useImageUpload();
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<User>({
 username: "",
 email: "",
 bio: "",
 avatar: "",
 link: "",
 answered: 0,
 posted: 0,
 dmEnabled: true,
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
 <PageTransition className="max-w-[40rem] w-full mt-0 space-y-0 pb-36 md:pb-16 relative">
 {isProfileLoading ? (
 <Skeleton className="h-28 w-auto mb-2 mx-4" />
 ) : (
 <div className="h-40 w-auto mb-4 mx-4 mt-4 bg-neutral-100 dark:bg-neutral-800/60 rounded-2xl">
 <FluidGradientText text={displayUser.username} svgViewBoxHeight={240} />
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
  <Drawer>
    <DrawerTrigger asChild>
      <Button variant="outline" size="icon" className="size-8 rounded-full">
        <HugeiconsIcon icon={MoreHorizontalIcon} className="size-5" />
      </Button>
    </DrawerTrigger>
    <DrawerContent className="sm:!left-1/2 sm:!-translate-x-1/2 sm:!right-auto sm:!min-w-[420px] sm:!w-auto sm:max-w-[90vw]">
      <div className="px-6 pb-8 pt-2 space-y-5">

        {/* Theme */}
        <div className="space-y-3">
          <span className="text-[10px] text-neutral-400 tracking-wide uppercase">Theme</span>
          <div className="flex gap-1.5">
            {[
              { key: "light" as const, icon: Sun03Icon, label: "Light" },
              { key: "dark" as const, icon: Moon02Icon, label: "Dark" },
              { key: "system" as const, icon: ComputerIcon, label: "System" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={cn(
                  "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs border transition-all cursor-pointer",
                  theme === t.key
                    ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100"
                    : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
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
          <span className="text-[10px] text-neutral-400 tracking-wide uppercase">Accent</span>
          <div className="flex gap-3">
            {(["orange", "blue", "violet", "rose", "green"] as AccentTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => setAccent(t)}
                className={cn(
                  "size-7 rounded-full transition-all cursor-pointer",
                  accent === t && "ring-2 ring-offset-2 ring-neutral-400 dark:ring-neutral-600"
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
            <HugeiconsIcon icon={Message02Icon} className="size-4 text-neutral-400" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Direct Messages</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={displayUser.dmEnabled}
            onClick={() => updateProfile({ ...displayUser, dmEnabled: !displayUser.dmEnabled })}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none",
              displayUser.dmEnabled
                ? "bg-neutral-900 dark:bg-neutral-100"
                : "bg-neutral-200 dark:bg-neutral-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform",
                displayUser.dmEnabled ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </div>

        <button
          onClick={() => startTour()}
          className="flex items-center gap-3 w-full py-1.5 cursor-pointer"
        >
          <HugeiconsIcon icon={HelpCircleIcon} className="size-4 text-neutral-400" />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">Restart Tour</span>
        </button>

        <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

        {/* Account */}
        <button
          onClick={() => signout()}
          className="flex items-center gap-3 w-full py-1.5 cursor-pointer text-red-500"
        >
          <HugeiconsIcon icon={Logout01Icon} className="size-4" />
          <span className="text-sm">Sign Out</span>
        </button>

        <button
          onClick={() => setIsDeleteOpen(true)}
          className="flex items-center gap-3 w-full py-1.5 cursor-pointer text-red-500"
        >
          <HugeiconsIcon icon={Alert02Icon} className="size-4" />
          <span className="text-sm">Delete Account</span>
        </button>

      </div>
    </DrawerContent>
  </Drawer>
 </div>
 </div>
 <div className="space-y-1 w-full">
 <h1 className="text-2xl text-neutral-900 dark:text-neutral-100">
 {displayUser.username}
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
 <span>DMs {displayUser.dmEnabled ? "enabled" : "disabled"}</span>
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
 </>
 ) : (
 <>
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
 </div>
 <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 my-6" />
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
 <p className="text-red-500 text-sm">Failed to load activity</p>
 ) : (
 <div className="space-y-4">
  <div className="border border-neutral-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden">
    <QuestionList
    questions={questions}
    onDelete={(id) => deleteQuestion(id)}
    />
  </div>
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
   <label className="text-sm font-medium">Avatar</label>
   <div className="flex items-center gap-3">
   {editForm.avatar ? (
   <>
   <img src={editForm.avatar} className="size-10 rounded-full object-cover" />
   <button
   type="button"
   onClick={() => updateDraft({ avatar: "" })}
   className="text-xs text-red-500 hover:text-red-600 cursor-pointer"
   >
   Remove
   </button>
   </>
   ) : (
   <label className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
   {imageUploading ? (
   <span className="inline-block size-3.5 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin" />
   ) : (
   <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
   )}
   {imageUploading ? "Uploading..." : "Upload Image"}
   <input
   type="file"
   accept="image/*"
   className="hidden"
   disabled={imageUploading}
   onChange={async (e) => {
   const file = e.target.files?.[0];
   if (!file) return;
   const reader = new FileReader();
   reader.onload = () => {
   setCropImageSrc(reader.result as string);
   };
   reader.readAsDataURL(file);
   e.target.value = "";
   }}
   />
   </label>
   )}
   </div>
   </div>
  <CropImageDialog
  open={!!cropImageSrc}
  onOpenChange={() => setCropImageSrc(null)}
  imageSrc={cropImageSrc || ""}
  onCropComplete={async (blob) => {
  const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
  const url = await uploadImage(file);
  if (url) updateDraft({ avatar: url });
  setCropImageSrc(null);
  }}
  />
 <div className="flex items-center justify-between py-2 border-t border-neutral-100 dark:border-neutral-800">
 <div>
 <span className="text-sm font-medium">Allow DMs</span>
 <p className="text-xs text-neutral-500">Let other users message you</p>
 </div>
 <button
 type="button"
 role="switch"
 aria-checked={editForm.dmEnabled ?? true}
 onClick={() => updateDraft({ dmEnabled: !(editForm.dmEnabled ?? true) })}
 className={cn(
 "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none",
 (editForm.dmEnabled ?? true) ? "bg-[var(--brand)]" : "bg-neutral-300 dark:bg-neutral-700"
 )}
 >
 <span
 className={cn(
 "pointer-events-none inline-block size-4 rounded-full bg-white transform transition-transform",
 (editForm.dmEnabled ?? true) ? "translate-x-4" : "translate-x-0.5"
 )}
 />
 </button>
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
 </div>
 </PageTransition>
 );
}
