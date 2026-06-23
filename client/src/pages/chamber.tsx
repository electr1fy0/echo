import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  ArrowLeft02Icon,
  Calendar03Icon,
  PencilEdit02Icon,
  Pin02Icon,
  Delete02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useNavigate, useParams } from "react-router";
import { QuestionList } from "@/components/questions/question-list";
import { PinnedPostCard } from "@/components/questions/pinned-post-card";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import {
  useJoinChamber,
  useLeaveChamber,
  useListChambers,
  useDeleteChamber,
} from "@/hooks/use-chamber";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn, getInitials } from "@/lib/utils";
import {
  useDeleteQuestion,
  useInfiniteQuestionsQuery,
  useCreateQuestion,
  useQuestionDraft,
  usePinnedQuestionsQuery,
} from "@/hooks/use-questions";
import { PageTransition } from "@/components/page-transition";
import { EditChamberDialog } from "@/components/chambers/edit-chamber-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { MentionField } from "@/components/ui/mention-field";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { toast } from "@/lib/toast";
import { haptic } from "@/lib/haptic";

function formatMemberCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export default function ChamberPage() {
  const { chamberId } = useParams<{ chamberId: string }>();
  const navigate = useNavigate();
  const { data: chambersData, isLoading: isChamberLoading } = useListChambers();
  const { data: user, isLoading: isAuthLoading } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const chambers = chambersData || [];
  const chamber = chambers.find((c) => c.uid === chamberId);
  const { mutate: deleteQn } = useDeleteQuestion();
  const deleteChamberMutation = useDeleteChamber();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Search, Sort, Filter state
  const [searchVal, setSearchVal] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"time_created" | "votes" | "hot">("hot");
  const [postScope, setPostScope] = useState<"all" | "my-posts">("all");
  const [postTypeFilter, setPostTypeFilter] = useState<"all" | "qna" | "partner" | "trade" | "taxi">("all");
  const [publisherPostType, setPublisherPostType] = useState<"qna" | "partner" | "trade" | "taxi">("qna");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const {
    data: questionsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuestionsQuery(
    sortBy,
    undefined,
    chamberId,
    postScope === "my-posts" ? user?.username : undefined,
    20,
    postTypeFilter === "all" ? undefined : postTypeFilter,
    false,
    debouncedSearch || undefined
  );
  const questions = questionsData ? questionsData.pages.flat() : [];
  const { data: pinnedPosts = [] } = usePinnedQuestionsQuery(chamberId, postTypeFilter === "all" ? undefined : postTypeFilter);

  // Publisher State & Hooks
  const { mutate: submitQuestion, isPending: isCreatePending } = useCreateQuestion();
  const { draft, updateDraft, resetDraft } = useQuestionDraft();
  
  // Pivot draft additions
  const [partnerSlotsNeeded, setPartnerSlotsNeeded] = useState(1);
  const [tradePrice, setTradePrice] = useState("");
  const [tradeCondition, setTradeCondition] = useState("Like New");
  const [ttlHours, setTtlHours] = useState<number | null>(null);

  // Taxi draft additions
  const [taxiDeparture, setTaxiDeparture] = useState("");
  const [taxiDestination, setTaxiDestination] = useState("");
  const [taxiDatetime, setTaxiDatetime] = useState("");



  const handlePublish = async () => {
    if (!draft.content.trim() || !chamberId || isCreatePending) return;

    const payload = {
      content: draft.content,
      chamberUid: chamberId,
      postType: publisherPostType,
      ...(publisherPostType === "partner" ? {
        partnerSlotsNeeded: Number(partnerSlotsNeeded),
      } : {}),
      ...(publisherPostType === "trade" ? {
        tradePrice: Math.round(Number(tradePrice) * 100), // Convert to cents
        tradeCondition,
      } : {}),
      ...(publisherPostType === "taxi" ? {
        taxiDeparture,
        taxiDestination,
        taxiDatetime,
      } : {}),
      ttlHours,
    };

    submitQuestion(payload, {
      onSuccess: () => {
        resetDraft();
        setTtlHours(null);
        setTradePrice("");
        setPartnerSlotsNeeded(1);
        setTaxiDeparture("");
        setTaxiDestination("");
        setTaxiDatetime("");
        toast.success("Published successfully!");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to publish post");
      },
    });
  };

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

  const joinMutation = useJoinChamber();
  const leaveMutation = useLeaveChamber();
  const isPending = joinMutation.isPending || leaveMutation.isPending;
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isChamberLoading) {
    return (
      <div className="max-w-[40rem] w-full md:mt-24 mt-16 px-4 space-y-8">
        <div className="flex items-start gap-4">
          <Skeleton className="size-16 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full max-w-[200px]" />
            <div className="flex gap-4 mt-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
        <QuestionListSkeleton />
      </div>
    );
  }

  if (!chamber) {
    return (
      <div className="max-w-xl w-full mt-40 px-4">
        <p className="text-neutral-500">Chamber not found</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <HugeiconsIcon icon={ArrowLeft02Icon} className="mr-2 size-4" />
          Go back
        </Button>
      </div>
    );
  }

  const colorClass = CHAMBER_COLORS[(chamber.colorIndex ?? 0) % CHAMBER_COLORS.length];
  const handleToggleJoin = () => {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    if (!chamber?.uid) return;
    if (chamber.isJoined) {
      leaveMutation.mutate(chamber.uid);
    } else {
      joinMutation.mutate(chamber.uid);
    }
  };

  const canPin = !!user?.username && user.username === chamber.creatorUsername;

  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 pb-36 md:pb-16 relative px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-6 transition-colors cursor-pointer"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
        Back
      </button>

      {/* Header Info */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={cn(
            "size-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-sm",
            colorClass,
          )}
        >
          {getInitials(chamber.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {chamber.name}
            </h1>
          </div>
          <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{chamber.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400 dark:text-neutral-500">
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={UserMultiple02Icon} className="size-3.5" />
              {formatMemberCount(chamber.memberCount || 0)} members
            </span>
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
              Created{" "}
              {chamber.timeCreated
                ? new Date(chamber.timeCreated).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "Jan 2026"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canPin && (
            <>
              <Button
                variant="outline"
                className="rounded-full h-8 px-4 text-xs font-semibold cursor-pointer border-neutral-200 dark:border-neutral-800"
                onClick={() => setIsEditOpen(true)}
              >
                <HugeiconsIcon icon={PencilEdit02Icon} className="mr-1 size-4 text-neutral-500" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="rounded-full h-8 px-4 text-xs font-semibold cursor-pointer border-neutral-200 dark:border-neutral-800 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                onClick={() => setIsDeleteOpen(true)}
              >
                <HugeiconsIcon icon={Delete02Icon} className="mr-1 size-4" />
                Delete
              </Button>
            </>
          )}
          <Button
            variant={chamber.isJoined ? "outline" : "default"}
            className={cn(
              "rounded-full h-8 px-4 text-xs font-semibold cursor-pointer border-none shadow-none",
              chamber.isJoined 
                ? "border border-neutral-200 hover:bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:hover:bg-neutral-900 dark:text-neutral-400"
                : "bg-[#ff5a1f] hover:bg-[#e94a12] text-white"
            )}
            disabled={isPending}
            onClick={() => { haptic(); handleToggleJoin(); }}
          >
            {chamber.isJoined ? "Joined" : "Join"}
          </Button>
        </div>
      </div>

      {/* Search Input Bar (No Outer Box) */}
      <div className="relative w-full mb-6">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500"
        />
        <input
          type="text"
          placeholder="Search in this chamber..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full h-10 pl-10 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background/50 dark:bg-background/20 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all shadow-sm"
        />
        {searchVal && (
          <button
            onClick={() => setSearchVal("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors text-xs font-semibold cursor-pointer border-none bg-transparent flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>      {/* Dynamic Publisher Card */}
      {isAuthLoading && chamber.isJoined ? (
        <div className="border border-dashed border-neutral-300 dark:border-neutral-700 bg-background rounded-2xl mb-6 p-4 space-y-3 animate-pulse">
          <div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
          <div className="flex justify-between items-center">
            <div className="h-7 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
            <div className="h-7 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
          </div>
        </div>
      ) : user && chamber.isJoined ? (
        <div className="border border-dashed border-neutral-300 dark:border-neutral-700 bg-background rounded-2xl mb-6 transition-colors focus-within:border-neutral-400 dark:focus-within:border-neutral-500 overflow-hidden">
          <MentionField
              placeholder={
                publisherPostType === "qna"
                  ? "Ask a question or share class news..."
                  : publisherPostType === "partner"
                    ? "Describe the project and what you're looking for..."
                    : publisherPostType === "trade"
                      ? "List what you're selling and any relevant details..."
                      : "Describe your taxi route and ride details..."
              }
            ariaLabel="Post content"
            className="resize-none min-h-[72px] border-none shadow-none focus-visible:ring-0 bg-transparent px-4 pt-3 pb-2 text-sm"
            value={draft.content}
            onValueChange={(value) => updateDraft({ content: value })}
            multiline
          />

          {/* Post Type Selector tabs */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 overflow-x-auto scrollbar-none">
            {(["qna", "partner", "trade", "taxi"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPublisherPostType(type)}
                className={cn(
                  "h-6 px-2 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border whitespace-nowrap",
                  publisherPostType === type
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                    : "bg-transparent text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600",
                )}
              >
                {type === "qna" ? "Discussions" : type === "partner" ? "Partners" : type === "trade" ? "Marketplace" : "Taxi"}
              </button>
            ))}
          </div>

          {/* Single inline toolbar row */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40">

            {/* Partners: compact slot stepper */}
            {publisherPostType === "partner" && (
              <div className="flex items-center gap-1.5 mr-auto">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 select-none">
                  Slots
                </span>
                <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPartnerSlotsNeeded(Math.max(1, partnerSlotsNeeded - 1))}
                    className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium cursor-pointer select-none"
                  >
                    −
                  </button>
                  <span className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 border-x border-neutral-200 dark:border-neutral-700 select-none">
                    {partnerSlotsNeeded}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPartnerSlotsNeeded(Math.min(10, partnerSlotsNeeded + 1))}
                    className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium cursor-pointer select-none"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Taxi: inline departure, destination, datetime, seats */}
            {publisherPostType === "taxi" && (
              <div className="flex items-center gap-2 mr-auto flex-wrap">
                <input
                  type="text"
                  placeholder="Departure"
                  value={taxiDeparture}
                  onChange={(e) => setTaxiDeparture(e.target.value)}
                  className="w-24 h-7 text-xs px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none"
                />
                <span className="text-neutral-400 text-xs">→</span>
                <input
                  type="text"
                  placeholder="Destination"
                  value={taxiDestination}
                  onChange={(e) => setTaxiDestination(e.target.value)}
                  className="w-24 h-7 text-xs px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none"
                />
                <DateTimePicker
                  value={taxiDatetime}
                  onChange={setTaxiDatetime}
                  placeholder="Pick date & time"
                />
              </div>
            )}

            {/* Marketplace: inline price + condition */}
            {publisherPostType === "trade" && (
              <div className="flex items-center gap-2 mr-auto">
                <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden h-7 bg-background">
                  <span className="px-2 text-xs text-neutral-400 font-medium select-none border-r border-neutral-200 dark:border-neutral-700">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Price"
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    className="w-20 h-7 text-xs px-2 bg-transparent text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <select
                  value={tradeCondition}
                  onChange={(e) => setTradeCondition(e.target.value)}
                  className="h-7 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background px-2 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
                >
                  <option value="New">Brand New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used">Used</option>
                  <option value="PDF/Digital">Digital/PDF</option>
                </select>
              </div>
            )}

            {/* Spacer: push actions right when no metadata */}
            {publisherPostType === "qna" && <div className="flex-1" />}

            {/* Disappearing posts toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  const options: (number | null)[] = [null, 1, 2, 6, 24];
                  const idx = options.indexOf(ttlHours);
                  setTtlHours(options[(idx + 1) % options.length]);
                }}
                className={cn(
                  "flex items-center gap-1 h-7 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 border",
                  ttlHours !== null
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                    : "bg-transparent text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:text-neutral-600 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {ttlHours !== null ? `${ttlHours}h` : "Off"}
              </button>
            </div>

            <Button
              onClick={() => { haptic(); handlePublish(); }}
              disabled={isCreatePending || !draft.content.trim()}
              className="bg-[#ff5a1f] hover:bg-[#e94a12] text-white rounded-lg text-xs h-7 px-4 border-none font-semibold cursor-pointer shrink-0"
            >
              {isCreatePending ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Filters and Sort Row */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {/* Sort By Dropdown */}
        <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background px-3 h-8.5 gap-1.5 bg-neutral-50/50 dark:bg-neutral-900/30">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "time_created" | "votes" | "hot")}
            className="bg-transparent text-xs text-neutral-700 dark:text-neutral-300 font-semibold focus:outline-none cursor-pointer border-none pr-4"
          >
            <option value="hot">Hot</option>
            <option value="time_created">Recent</option>
            <option value="votes">Top Posts</option>
          </select>
        </div>

        {/* Post Type Filter Dropdown */}
        <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background px-3 h-8.5 gap-1.5 bg-neutral-50/50 dark:bg-neutral-900/30">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Type</span>
          <select
            value={postTypeFilter}
            onChange={(e) => setPostTypeFilter(e.target.value as "all" | "qna" | "partner" | "trade" | "taxi")}
            className="bg-transparent text-xs text-neutral-700 dark:text-neutral-300 font-semibold focus:outline-none cursor-pointer border-none pr-4"
          >
            <option value="all">All posts</option>
            <option value="qna">Discussions</option>
            <option value="partner">Find Partners</option>
            <option value="trade">Marketplace</option>
            <option value="taxi">Taxi / Rides</option>
          </select>
        </div>

        {/* Scope Filter */}
        {user && (
          <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background px-3 h-8.5 gap-1.5 bg-neutral-50/50 dark:bg-neutral-900/30">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Scope</span>
            <select
              value={postScope}
              onChange={(e) => setPostScope(e.target.value as "all" | "my-posts")}
              className="bg-transparent text-xs text-neutral-700 dark:text-neutral-300 font-semibold focus:outline-none cursor-pointer border-none pr-4"
            >
              <option value="all">All authors</option>
              <option value="my-posts">My posts</option>
            </select>
          </div>
        )}
      </div>

      {/* Pinned Posts Carousel */}
      {pinnedPosts.length > 0 && !debouncedSearch && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-neutral-400 dark:text-neutral-500">
            <HugeiconsIcon icon={Pin02Icon} className="size-3.5 text-[#ff5a1f]" />
            <span>Pinned Posts</span>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-3 pt-1 px-1 scrollbar-none snap-x snap-mandatory -mx-4 md:mx-0 px-4 md:px-0">
            {pinnedPosts.map((postItem) => (
              <PinnedPostCard
                key={postItem.question.uid}
                questionItem={postItem}
                canPin={canPin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Post feed block */}
      <div className="space-y-4">
        {isLoading ? (
          <QuestionListSkeleton />
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            <QuestionList
              questions={questions}
              onDelete={(id) => deleteQn(id)}
              canPin={canPin}
            />
            {hasNextPage && (
              <div ref={loadMoreCallbackRef} className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-full w-full py-5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors gap-2 cursor-pointer border border-neutral-200 dark:border-neutral-800"
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
          <div className="text-center py-12 text-neutral-500 bg-neutral-50/10 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
            <p className="text-sm font-medium">No posts here yet.</p>
            <p className="text-xs text-neutral-400 mt-1">
              {chamber.isJoined ? "Be the first to create one using the editor above!" : "Join this chamber to share your first post!"}
            </p>
          </div>
        )}
      </div>

      {canPin && chamber.uid && (
        <EditChamberDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          chamber={chamber}
        />
      )}

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chamber</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-500">
            Are you sure you want to delete <strong>{chamber?.name}</strong>? This will permanently remove the chamber and all its posts. This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="rounded-full" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={deleteChamberMutation.isPending}
              onClick={() => {
                if (!chamber?.name) return;
                deleteChamberMutation.mutate(chamber.name, {
                  onSuccess: () => {
                    navigate("/");
                  },
                });
              }}
            >
              {deleteChamberMutation.isPending ? "Deleting..." : "Delete Chamber"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
