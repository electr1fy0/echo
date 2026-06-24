import { useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useFetchPublicProfile } from "@/hooks/use-profile";
import { useInfiniteQuestionsQuery } from "@/hooks/use-questions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon, Message01Icon } from "@hugeicons/core-free-icons";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import { ProfileSkeleton } from "@/components/ui/skeletons";
import { PageTransition } from "@/components/page-transition";
import { FluidGradientText } from "@/components/fluid-gradient-text";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useCreateConversation } from "@/hooks/use-dms";
import { toast } from "@/lib/toast";

export default function PublicProfile() {
 const { username } = useParams<{ username: string }>();
 const navigate = useNavigate();
 const { data: currentUser } = useAuth();
 const { open: openAuthModal } = useAuthModal();
 const { mutate: startConversation, isPending } = useCreateConversation();

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
 } = useInfiniteQuestionsQuery(
 undefined,
 undefined,
 undefined,
 username,
 );
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
 <PageTransition className="max-w-[40rem] w-full mt-0 space-y-0 pb-36 md:pb-16 relative">
 <div className="h-40 w-auto mb-4 mx-4 mt-4 bg-neutral-100 dark:bg-neutral-800/60 rounded-2xl">
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
 onError: (err) => toast.error(err instanceof Error ? err.message : "Cannot start conversation"),
 });
 }}
 >
 <HugeiconsIcon icon={Message01Icon} className="mr-1.5 size-4" />
 Message
 </Button>
 )}
 </div>
 <div className="space-y-1">
 <h1 className="text-2xl text-neutral-900 dark:text-neutral-100">
 {user.username}
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
    <QuestionList questions={questions} />
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
 ) : (
 <EmptyState title="No questions posted yet" />
 )}
 </div>
 </div>
 </PageTransition>
 );
}
