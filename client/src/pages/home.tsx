import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import {
  useQuestionDraft,
  useCreateQuestion,
  useDeleteQuestion,
  useInfiniteQuestionsQuery,
} from "@/hooks/use-questions";
import { Link } from "react-router";
import { MentionField } from "@/components/ui/mention-field";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import {
  Add01Icon,
  Time02Icon,
  FireIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn, getToken } from "@/lib/utils";
import { useListChambers } from "@/hooks/use-chamber";
import { ChamberCard } from "@/components/chambers/chamber-list";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { TextFlip } from "@/components/text-flip";

import { PageTransition } from "@/components/page-transition";
import { validateMentions } from "@/lib/mention-validation";
import { toast } from "@/lib/toast";

export default function Home() {
  const { data: user, isLoading: isAuthLoading } = useAuth();
  const hasToken = !!getToken();
  const { open: openAuthModal } = useAuthModal();
  const [activeTab, setActiveTab] = useState<"recent" | "trending">("recent");
  const [selectedChamber, setSelectedChamber] = useState<string>("");
  const { mutate: submitQuestion, isPending: isCreatePending } =
    useCreateQuestion();
  const [isValidating, setIsValidating] = useState(false);
  const { draft, updateDraft, resetDraft } = useQuestionDraft();
  const { mutate: deleteQuestion } = useDeleteQuestion();

  // Post type & metadata states
  const [postType, setPostType] = useState<"qna" | "partner" | "trade" | "taxi">("qna");
  const [partnerSlotsNeeded, setPartnerSlotsNeeded] = useState(1);
  const [tradePrice, setTradePrice] = useState("");
  const [tradeCondition, setTradeCondition] = useState("Like New");
  const [ttlHours, setTtlHours] = useState<number | null>(null);
  const [taxiDeparture, setTaxiDeparture] = useState("");
  const [taxiDestination, setTaxiDestination] = useState("");
  const [taxiDatetime, setTaxiDatetime] = useState("");

  const { data: chambersData, isLoading } = useListChambers();
  const chambers = chambersData || [];
  const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);
  const {
    data: questionsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isQuestionsLoading,
  } = useInfiniteQuestionsQuery(
    activeTab === "trending" ? "votes" : "time_created",
    hasToken ? "joined" : undefined,
  );
  const questions = questionsData ? questionsData.pages.flat() : [];

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
  const selectedChamberData = JOINED_CHAMBERS.find(
    (c) => c.uid === selectedChamber,
  );
  const handleSubmit = async () => {
    if (
      !draft.content.trim() ||
      !selectedChamber ||
      isCreatePending ||
      isValidating
    )
      return;
    setIsValidating(true);
    try {
      const result = await validateMentions(draft.content);
      if (result.missing.length > 0) {
        toast.error(`User not found: ${result.missing.join(", ")}`);
        setIsValidating(false);
        return;
      }

      const payload = {
        content: draft.content,
        chamberUid: selectedChamber,
        postType,
        ...(postType === "partner" ? {
          partnerSlotsNeeded: Number(partnerSlotsNeeded),
        } : {}),
        ...(postType === "trade" ? {
          tradePrice: tradePrice ? Math.round(Number(tradePrice) * 100) : 0, // Convert to cents
          tradeCondition,
        } : {}),
        ...(postType === "taxi" ? {
          taxiDeparture,
          taxiDestination,
          taxiDatetime,
        } : {}),
        ttlHours,
      };

      submitQuestion(
        payload,
        {
          onSuccess: () => {
            resetDraft();
            setSelectedChamber("");
            setTtlHours(null);
            setTradePrice("");
            setPartnerSlotsNeeded(1);
            setTaxiDeparture("");
            setTaxiDestination("");
            setTaxiDatetime("");
            toast.success("Posted successfully!");
          },
          onSettled: () => {
            setIsValidating(false);
          },
        },
      );
    } catch {
      toast.error("Failed to validate mentions");
      setIsValidating(false);
    }
  };
  return (
    <PageTransition className="max-w-[40rem] w-full md:mt-24 mt-16 space-y-4 pb-36 md:pb-16 relative px-4">
      <h1 className="text-neutral-800 dark:text-neutral-200 text-lg py-0 my-0 text-balance">
        TurnsOut
      </h1>
      <h2 className="text-neutral-600 dark:text-neutral-400 text-sm text-balance inline-grid">
        <span className="invisible col-start-1 row-start-1 select-none" aria-hidden>
          Campus questions, answered by the people who get it.
        </span>
        <TextFlip
          as="span"
          interval={3}
          className="col-start-1 row-start-1"
        >
          <span>Ask. Trade. Ride. Connect.</span>
          <span>The platform built for campus life.</span>
          <span>Where students help students.</span>
          <span>Campus questions, answered by the people who get it.</span>
          <span>Your campus community, one message away.</span>
        </TextFlip>
      </h2>
      {isAuthLoading ? (
        <div className="border border-dashed border-neutral-300 dark:border-neutral-700 bg-background rounded-2xl p-4 space-y-3 animate-pulse">
          <div className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
          <div className="flex justify-between items-center">
            <div className="h-8 w-28 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
            <div className="h-8 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
          </div>
        </div>
      ) : user ? (
        <div className="space-y-3">
          <div
            className="
              border border-dashed
              border-neutral-300 dark:border-neutral-700
              bg-background rounded-2xl
              transition-colors
              focus-within:border-neutral-400
              dark:focus-within:border-neutral-500
              overflow-hidden
            "
          >
            <MentionField
              placeholder={
                selectedChamberData
                  ? postType === "qna"
                    ? `Ask in ${selectedChamberData.name}...`
                    : postType === "partner"
                      ? `Describe the project in ${selectedChamberData.name}...`
                      : postType === "trade"
                        ? `List item details in ${selectedChamberData.name}...`
                        : `Describe ride details in ${selectedChamberData.name}...`
                  : "Select a chamber to make a post..."
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
                  onClick={() => setPostType(type)}
                  className={cn(
                    "h-6 px-2 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border whitespace-nowrap",
                    postType === type
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                      : "bg-transparent text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600",
                  )}
                >
                  {type === "qna" ? "Discussions" : type === "partner" ? "Partners" : type === "trade" ? "Marketplace" : "Taxi"}
                </button>
              ))}
            </div>

            {/* Toolbar section */}
            <div className="flex flex-col gap-2 p-2 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800">
              
              {/* Inline metadata configurations depending on post type */}
              {(postType === "partner" || postType === "trade" || postType === "taxi") && (
                <div className="flex items-center gap-2 flex-wrap px-1.5 py-1 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  {postType === "partner" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 select-none">
                        Slots
                      </span>
                      <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-background">
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

                  {postType === "trade" && (
                    <div className="flex items-center gap-2">
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

                  {postType === "taxi" && (
                    <div className="flex items-center gap-2 flex-wrap">
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
                </div>
              )}

              {/* Main Actions Row */}
              <div className="flex items-center justify-between gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-2 h-8 px-2.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors focus:outline-none">
                    {selectedChamberData ? (
                      <>
                        <div
                          className={cn(
                            "size-2 rounded-full",
                            CHAMBER_COLORS[
                              (selectedChamberData.colorIndex || 0) %
                                CHAMBER_COLORS.length
                            ],
                          )}
                        />
                        {selectedChamberData.name}
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          className="size-3.5 text-neutral-500"
                        />
                        Select Chamber
                      </>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {JOINED_CHAMBERS.length > 0 ? (
                      JOINED_CHAMBERS.map((chamber, i) => (
                        <DropdownMenuItem
                          key={chamber.uid || i}
                          onClick={() => setSelectedChamber(chamber.uid!)}
                          className="gap-2"
                        >
                          <div
                            className={cn(
                              "size-3 rounded-full",
                              CHAMBER_COLORS[
                                (chamber.colorIndex || 0) % CHAMBER_COLORS.length
                              ],
                            )}
                          />
                          {chamber.name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-neutral-500">
                        No chambers joined
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-2">
                  {/* Disappearing post duration timer */}
                  <button
                    type="button"
                    onClick={() => {
                      const options: (number | null)[] = [null, 1, 2, 6, 24];
                      const idx = options.indexOf(ttlHours);
                      setTtlHours(options[(idx + 1) % options.length]);
                    }}
                    className={cn(
                      "flex items-center gap-1 h-8 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 border",
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

                  <Button
                    size="sm"
                    className="bg-[#ff5a1f] hover:bg-[#e94a12] text-white rounded-lg text-xs h-8 px-4 border-none font-semibold cursor-pointer shrink-0"
                    onClick={handleSubmit}
                    disabled={
                      !selectedChamber ||
                      !draft.content.trim() ||
                      isValidating ||
                      isCreatePending
                    }
                  >
                    {isCreatePending ? "Posting..." : "Post"}
                    <HugeiconsIcon
                      icon={Add01Icon}
                      strokeWidth={2}
                      className="ml-1.5 size-3.5"
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-background p-6">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-normal text-neutral-800 dark:text-neutral-100">
                Join the TurnsOut community
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-[28rem] leading-relaxed">
                Sign in or register today to join chambers, find project partners, trade items, coordinate rides, and connect with your campus!
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-4 h-9 cursor-pointer"
                onClick={() => openAuthModal("signin")}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-[#ff5a1f] hover:bg-[#e94a12] text-white px-4 h-9 border-none cursor-pointer"
                onClick={() => openAuthModal("signup")}
              >
                Sign up
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="my-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {isAuthLoading ? (
              <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded" />
            ) : user ? (
              "From your chambers"
            ) : (
              "Public feed"
            )}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("recent")}
              className={cn(
                "h-7 rounded-full text-xs px-3 transition-all gap-1.5",
                activeTab === "recent"
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
              )}
            >
              <HugeiconsIcon
                icon={Time02Icon}
                className="size-3.5"
                strokeWidth={2}
              />
              Recent
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("trending")}
              className={cn(
                "h-7 rounded-full text-xs px-3 transition-all gap-1.5",
                activeTab === "trending"
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
              )}
            >
              <HugeiconsIcon
                icon={FireIcon}
                className="size-3.5"
                strokeWidth={2}
              />
              Trending
            </Button>
          </div>
        </div>
        {user && JOINED_CHAMBERS.length === 0 && !isLoading ? (
          <div className="space-y-4">
            <div className="text-center py-6">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                You haven't joined any chambers yet.
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Join some chambers to see questions in your feed.
              </p>
            </div>
            {chambers.filter((c) => !c.isJoined).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Suggested Chambers
                </h4>
                <div className="space-y-2">
                  {chambers
                    .filter((c) => !c.isJoined)
                    .slice(0, 4)
                    .map((chamber, i) => (
                      <ChamberCard
                        key={chamber.uid || i}
                        chamber={{
                          ...chamber,
                          colorIndex: chamber.colorIndex ?? i,
                        }}
                      />
                    ))}
                </div>
                <Link
                  to="/chambers"
                  className="block text-center text-sm text-primary hover:underline pt-2"
                >
                  Show All Chambers
                </Link>
              </div>
            )}
          </div>
        ) : isQuestionsLoading ? (
          <QuestionListSkeleton count={3} />
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            <QuestionList
              questions={questions}
              onDelete={(id) => deleteQuestion(id)}
              showChamberName
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
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">No questions in your feed.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
