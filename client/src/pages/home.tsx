import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth, useToken } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import {
 useDeleteQuestion,
 useInfiniteQuestionsQuery,
} from "@/hooks/use-questions";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { QuestionList } from "@/components/questions/question-list";
import { QuestionListSkeleton } from "@/components/questions/question-skeleton";
import {
 Add01Icon,
 ArrowDown01Icon,
 Delete02Icon,
 FilterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { useListChambers } from "@/hooks/use-chamber";
import { ChamberCard } from "@/components/chambers/chamber-list";
import { TextFlip } from "@/components/text-flip";
import { PageTransition } from "@/components/page-transition";

import {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface FeedColumn {
 id: string;
 title: string;
 sortBy: "time_created" | "votes" | "hot";
 postTypeFilter: "all" | "qna" | "partner" | "trade" | "taxi";
 chamberSource: "joined" | "global" | string;
 postScope: "all" | "my-posts";
}

interface ColumnFeedProps {
 column: FeedColumn;
 onDeleteColumn: () => void;
 onUpdateColumn: (updated: Partial<FeedColumn>) => void;
 user: any;
 hasToken: boolean;
 chambers: any[];
 JOINED_CHAMBERS: any[];
 deleteQuestion: (id: string) => void;
 canDelete: boolean;
}

function ColumnFeed({
 column,
 onDeleteColumn,
 onUpdateColumn,
 user,
 hasToken,
 chambers,
 JOINED_CHAMBERS,
 deleteQuestion,
 canDelete,
}: ColumnFeedProps) {
 const [showSettings, setShowSettings] = useState(false);
 const feedRef = useRef<HTMLDivElement>(null);
 const [scrollProgress, setScrollProgress] = useState(0);
 const [scrollThumbVisible, setScrollThumbVisible] = useState(false);
 const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

 const handleScroll = useCallback(() => {
 const el = feedRef.current;
 if (!el) return;
 const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
 setScrollProgress(Math.min(1, Math.max(0, progress)));
 setScrollThumbVisible(true);
 clearTimeout(scrollTimerRef.current);
 scrollTimerRef.current = setTimeout(() => setScrollThumbVisible(false), 1500);
 }, []);

 const isSpecificChamber =
 column.chamberSource !== "joined" && column.chamberSource !== "global";
 const selectedChamberObj = isSpecificChamber
 ? chambers.find((c) => c.uid === column.chamberSource)
 : undefined;

 const {
 data: questionsData,
 fetchNextPage,
 hasNextPage,
 isFetchingNextPage,
 isLoading: isQuestionsLoading,
 } = useInfiniteQuestionsQuery(
 column.sortBy,
 column.chamberSource === "joined" && hasToken ? "joined" : undefined,
 isSpecificChamber ? column.chamberSource : undefined,
 column.postScope === "my-posts" && user ? user.username : undefined,
 20,
 column.postTypeFilter === "all" ? undefined : column.postTypeFilter,
 false,
 undefined
 );

 const questions = questionsData ? questionsData.pages.flat() : [];

 const observerRef = useRef<IntersectionObserver | null>(null);
 const loadMoreCallbackRef = useCallback(
 (node: HTMLDivElement | null) => {
 if (observerRef.current) {
 observerRef.current.disconnect();
 observerRef.current = null;
 }

 if (node) {
 const observer = new IntersectionObserver(
 (entries) => {
 const entry = entries[0];
 if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
 fetchNextPage();
 }
 },
 { threshold: 0, rootMargin: "100px" }
 );
 observer.observe(node);
 observerRef.current = observer;
 }
 },
 [fetchNextPage, hasNextPage, isFetchingNextPage]
 );

 const feedEl = feedRef.current;
 const scrollRatio = feedEl ? feedEl.clientHeight / feedEl.scrollHeight : 1;
 const thumbHeightPct = Math.max(8 / (feedEl?.clientHeight ?? 100) * 100, Math.min(scrollRatio * 100, 100));
 const thumbTopPct = scrollProgress * (100 - thumbHeightPct);

 return (
 <div className="flex flex-col flex-1 min-h-0">
 {/* Column Header */}
 <div className="flex flex-col gap-2 mb-3">
 <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-2">
 <div className="flex-1 min-w-0 mr-2">
 <button
 onClick={() => setShowSettings(!showSettings)}
 className={cn(
 "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer border shrink-0",
 showSettings
 ? "bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-100 dark:border-neutral-100 dark:text-neutral-900 "
 : "bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-50 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80"
 )}
 title="Configure feed"
 >
 <HugeiconsIcon icon={FilterIcon} className="size-3.5" />
 <span>
 {column.chamberSource === "joined" 
 ? "Joined Feed" 
 : column.chamberSource === "global" 
 ? "Global Feed" 
 : (selectedChamberObj?.name || "Chamber")}
 {column.postTypeFilter !== "all" && ` • ${column.postTypeFilter === "qna" ? "Discussions" : column.postTypeFilter === "partner" ? "Partners" : column.postTypeFilter === "trade" ? "Market" : "Taxi"}`}
 {` • ${column.sortBy === "time_created" ? "Recent" : column.sortBy === "votes" ? "Top Posts" : "Hot"}`}
 </span>
 </button>
 </div>
 {canDelete && (
 <button
 onClick={onDeleteColumn}
 className="p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
 title="Remove column"
 >
 <HugeiconsIcon icon={Delete02Icon} className="size-4" />
 </button>
 )}
 </div>

 {/* Configurations Drawer */}
 {showSettings && (
 <div className="bg-neutral-50/90 dark:bg-neutral-900/60 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/80 space-y-4 text-xs transition-all ">
 
 {/* Sort & Scope Row */}
 <div className={cn("grid gap-3", user ? "grid-cols-2" : "grid-cols-1")}>
 {/* Sort Segment */}
 <div className="flex flex-col gap-1.5">
 <span className=" text-neutral-400 uppercase text-[9px] tracking-wider">Sort by</span>
 <div className="flex bg-neutral-100/80 dark:bg-neutral-900/60 p-0.5 rounded-lg border border-neutral-200/40 dark:border-neutral-800/40">
 <button
 type="button"
 onClick={() => onUpdateColumn({ sortBy: "time_created" })}
 className={cn(
 "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
 column.sortBy === "time_created"
 ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
 : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
 )}
 >
 Recent
 </button>
 <button
 type="button"
 onClick={() => onUpdateColumn({ sortBy: "hot" })}
 className={cn(
 "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
 column.sortBy === "hot"
 ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
 : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
 )}
 >
 Hot
 </button>
 <button
 type="button"
 onClick={() => onUpdateColumn({ sortBy: "votes" })}
 className={cn(
 "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
 column.sortBy === "votes"
 ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
 : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
 )}
 >
 Top Posts
 </button>
 </div>
 </div>

 {/* Scope Segment */}
 {user && (
 <div className="flex flex-col gap-1.5">
 <span className=" text-neutral-400 uppercase text-[9px] tracking-wider">Scope</span>
 <div className="flex bg-neutral-100/80 dark:bg-neutral-900/60 p-0.5 rounded-lg border border-neutral-200/40 dark:border-neutral-800/40">
 <button
 type="button"
 onClick={() => onUpdateColumn({ postScope: "all" })}
 className={cn(
 "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
 column.postScope === "all"
 ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
 : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
 )}
 >
 All
 </button>
 <button
 type="button"
 onClick={() => onUpdateColumn({ postScope: "my-posts" })}
 className={cn(
 "flex-1 text-center py-1 rounded-md text-[10px] transition-all cursor-pointer",
 column.postScope === "my-posts"
 ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 "
 : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
 )}
 >
 Mine
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Chamber Source Selector */}
 <div className="flex flex-col gap-1.5">
 <span className=" text-neutral-400 uppercase text-[9px] tracking-wider">Source</span>
 <DropdownMenu>
 <DropdownMenuTrigger className="flex items-center justify-between w-full bg-background rounded-lg border border-neutral-200 dark:border-neutral-850 px-3 py-1.5 text-[11px] text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer">
 <span className="truncate">
 {column.chamberSource === "joined"
 ? "Joined chambers"
 : column.chamberSource === "global"
 ? "All chambers (Global)"
 : chambers.find((c) => c.uid === column.chamberSource)?.name || "Select Chamber"}
 </span>
 <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-neutral-400 shrink-0 ml-1" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className="w-56 max-h-[250px] overflow-y-auto scrollbar-thin">
 {hasToken && (
 <DropdownMenuItem onClick={() => onUpdateColumn({ chamberSource: "joined" })} className="cursor-pointer">
 Joined chambers
 </DropdownMenuItem>
 )}
 <DropdownMenuItem onClick={() => onUpdateColumn({ chamberSource: "global" })} className="cursor-pointer">
 All chambers (Global)
 </DropdownMenuItem>
 {chambers.length > 0 && (
 <>
 <DropdownMenuSeparator />
 <div className="px-3 py-1 text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
 Specific Chambers
 </div>
 {chambers.map((c) => (
 <DropdownMenuItem key={c.uid} onClick={() => onUpdateColumn({ chamberSource: c.uid })} className="cursor-pointer">
 {c.name}
 </DropdownMenuItem>
 ))}
 </>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 {/* Type Pills */}
 <div className="flex flex-col gap-1.5">
 <span className=" text-neutral-400 uppercase text-[9px] tracking-wider">Post Type</span>
 <div className="flex flex-wrap gap-1.5">
 {[
 { key: "all", label: "All Posts" },
 { key: "qna", label: "Discussions" },
 { key: "partner", label: "Partners" },
 { key: "trade", label: "Market" },
 { key: "taxi", label: "Taxi / Rides" }
 ].map((type) => (
 <button
 key={type.key}
 type="button"
 onClick={() => onUpdateColumn({ postTypeFilter: type.key as any })}
 className={cn(
 "px-2.5 py-1 text-[10px] font-medium rounded-full border transition-all cursor-pointer",
 column.postTypeFilter === type.key
 ? "bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-100 dark:border-neutral-100 dark:text-neutral-900 "
 : "bg-background border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-200"
 )}
 >
 {type.label}
 </button>
 ))}
 </div>
 </div>

 </div>
 )}

 </div>

 {/* Feed Content Block */}
 <div className="flex-1 min-h-0 relative rounded-2xl border overflow-hidden">
 <div ref={feedRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto space-y-4 scrollbar-none">
 {column.chamberSource === "joined" && JOINED_CHAMBERS.length === 0 ? (
 <div className="space-y-6 px-4 py-4">
 <div className="relative overflow-hidden rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-850 bg-neutral-50/30 dark:bg-neutral-900/10 p-5 text-center">
 <p className="text-xs text-neutral-700 dark:text-neutral-300">
 You haven't joined any chambers yet
 </p>
 <p className="text-[11px] text-neutral-500 mt-1 max-w-[18rem] mx-auto leading-relaxed">
 Join some chambers to populate your feed, or change this column's source to Global Feed.
 </p>
 </div>

 {chambers.filter((c) => !c.isJoined).length > 0 && (
 <div className="space-y-3">
 <h4 className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide px-1">
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
 className="block text-center text-xs text-neutral-600 dark:text-neutral-400 hover:text-[#ff5a1f] transition-colors pt-2"
 >
 Explore all chambers →
 </Link>
 </div>
 )}
 </div>
 ) : isQuestionsLoading ? (
 <QuestionListSkeleton />
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
 className="rounded-full w-full py-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors gap-2 cursor-pointer text-xs"
 >
 {isFetchingNextPage ? (
 <>
 <span className="inline-block animate-spin size-3 rounded-full border border-neutral-300 dark:border-neutral-600 border-t-neutral-800 dark:border-t-neutral-200" />
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
 <div className="text-center py-12 text-neutral-500 px-4">
 <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-850 bg-neutral-50/30 dark:bg-neutral-900/10 p-5">
 <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">No posts matching filters.</p>
 <p className="text-[10px] text-neutral-400 mt-1">Try selecting different topics or check back later.</p>
 </div>
 </div>
 )}
 </div>
 <div
 className={cn(
 "absolute right-0.5 w-1 rounded-full pointer-events-none transition-opacity duration-300",
 "bg-neutral-400/50 dark:bg-neutral-500/50",
 scrollThumbVisible ? "opacity-100" : "opacity-0"
 )}
 style={{ height: `${thumbHeightPct}%`, top: `${thumbTopPct}%` }}
 />
 </div>
 </div>
 );
}

export default function Home() {
 const { data: user, isLoading: isAuthLoading } = useAuth();
 const token = useToken();
 const hasToken = !!token;
 const { open: openAuthModal } = useAuthModal();
 // Columns state
 const [columns, setColumns] = useState<FeedColumn[]>(() => {
 const saved = localStorage.getItem("turnsout_columns");
 if (saved) {
 try {
 const parsed: FeedColumn[] = JSON.parse(saved);
 if (!hasToken) {
 return parsed.map((c) =>
 c.chamberSource === "joined" ? { ...c, chamberSource: "global" } : c
 );
 }
 return parsed;
 } catch {
 // Fallback
 }
 }
 return [
 {
 id: "default-feed",
 title: "Main Feed",
 sortBy: hasToken ? "time_created" : "hot",
 postTypeFilter: "all",
 chamberSource: hasToken ? "joined" : "global",
 postScope: "all",
 },
 ];
 });

 useEffect(() => {
 localStorage.setItem("turnsout_columns", JSON.stringify(columns));
 }, [columns]);

 const handleAddColumn = () => {
 const newCol: FeedColumn = {
 id: `col-${Date.now()}`,
 title: `Column ${columns.length + 1}`,
 sortBy: "time_created",
 postTypeFilter: "all",
 chamberSource: "global",
 postScope: "all",
 };
 setColumns([...columns, newCol]);
 };

 const handleDeleteColumn = (id: string) => {
 setColumns(columns.filter((c) => c.id !== id));
 };

 const handleUpdateColumn = (id: string, updated: Partial<FeedColumn>) => {
 setColumns(
 columns.map((c) => (c.id === id ? { ...c, ...updated } : c))
 );
 };

 const { mutate: deleteQuestion } = useDeleteQuestion();

 const { data: chambersData } = useListChambers();
 const chambers = chambersData || [];
 const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);
 return (
 <PageTransition className="flex flex-col overflow-hidden w-full h-dvh pt-4 md:pt-6">
 {!user && !isAuthLoading && (
 <div className="max-w-[40rem] mx-auto w-full shrink-0 space-y-2 px-4 md:px-8 pb-2">
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
 <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 flex items-center justify-between gap-4">
 <button
 onClick={() => openAuthModal("signup")}
 className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-left cursor-pointer"
 >
 Join your campus community to interact.
 </button>
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
 {/* Columns Dashboard Container */}
 <div className={cn(
 "flex-1 flex overflow-x-auto gap-6 pb-2 px-4 md:px-8 min-h-0 scrollbar-modern scroll-smooth",
 columns.length === 1 && "sm:justify-center"
 )}>
 {columns.map((col) => (
 <div
 key={col.id}
 className="flex-shrink-0 w-full sm:w-[36rem] flex flex-col min-h-0"
 >
 <ColumnFeed
 column={col}
 onDeleteColumn={() => handleDeleteColumn(col.id)}
 onUpdateColumn={(updated) => handleUpdateColumn(col.id, updated)}
 user={user}
 hasToken={hasToken}
 chambers={chambers}
 JOINED_CHAMBERS={JOINED_CHAMBERS}
 deleteQuestion={deleteQuestion}
 canDelete={columns.length > 1}
 />
 </div>
 ))}

 {/* Add Column Button */}
 {user && (
 <button
 onClick={handleAddColumn}
 className="flex-shrink-0 flex items-center justify-center size-8 rounded-full border border-dashed border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-all cursor-pointer self-center"
 title="Add Column"
 aria-label="Add Column"
 >
 <HugeiconsIcon icon={Add01Icon} className="size-4" />
 </button>
 )}
 </div>
 </PageTransition>
 );
}
