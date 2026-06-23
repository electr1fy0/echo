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
 ArrowDown01Icon,
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
 useListChannels,
 useCreateChannel,
} from "@/hooks/use-chamber";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn, getInitials } from "@/lib/utils";
import {
 useDeleteQuestion,
 useInfiniteQuestionsQuery,
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
import {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { haptic } from "@/lib/haptic";
import { useCreatePostModal } from "@/hooks/use-create-post-modal";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

import {
  MessageSquare,
  ShoppingBag,
  Car,
  Users,
  Search,
  Hash,
  FileText,
  Plus,
  HelpCircle,
  Code,
  BookOpen,
  Utensils,
  PlusCircle,
  Trash2,
  Flame,
  Clock,
  Star,
  Globe,
  User,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
 "message-square": MessageSquare,
 "shopping-bag": ShoppingBag,
 "car": Car,
 "users": Users,
 "search": Search,
 "file-text": FileText,
 "help-circle": HelpCircle,
 "code": Code,
 "book-open": BookOpen,
 "utensils": Utensils,
 "hash": Hash,
};

const TEMPLATES = [
 {
 name: "Discussion",
 desc: "Q&A, general chatter, and thoughts",
 icon: "message-square",
 schema: [],
 },
 {
 name: "Marketplace",
 desc: "Sell textbooks, hostel gear, or electronics",
 icon: "shopping-bag",
 schema: [
 { id: "price", type: "currency", label: "Price (₹)", required: true },
 { id: "condition", type: "select", label: "Condition", options: ["Brand New", "Like New", "Used", "Digital/PDF"], required: true },
 { id: "category", type: "select", label: "Category", options: ["Textbooks", "Electronics", "Lab Gear", "Hostel Essentials", "Other"], required: false }
 ],
 },
 {
 name: "Carpools",
 desc: "Coordinate rides to airport, station, or weekend getaways",
 icon: "car",
 schema: [
 { id: "departure", type: "text", label: "From", required: true },
 { id: "destination", type: "text", label: "To", required: true },
 { id: "datetime", type: "datetime", label: "Departure Time", required: true },
 { id: "seats", type: "number", label: "Seats Available", required: true }
 ],
 },
 {
 name: "Study Partners",
 desc: "Form project groups, study pods, or hackathon teams",
 icon: "users",
 schema: [
 { id: "slots", type: "number", label: "Slots Needed", required: true },
 { id: "grade_target", type: "select", label: "Grade Target", options: ["A+ / Perfect Score", "Pass", "Just for Fun"], required: false },
 { id: "workstyle", type: "select", label: "Workstyle", options: ["In-person", "Online", "Hybrid"], required: false }
 ],
 },
 {
 name: "Lost & Found",
 desc: "Report misplaced campus keys, IDs, or accessories",
 icon: "search",
 schema: [
 { id: "type", type: "select", label: "Status", options: ["Lost", "Found"], required: true },
 { id: "item", type: "text", label: "Item Name", required: true },
 { id: "location", type: "text", label: "Location", required: false }
 ],
 },
 {
 name: "LeetCode Prep",
 desc: "Coordinate interview prep sessions & coding groups",
 icon: "code",
 schema: [
 { id: "difficulty", type: "select", label: "Target", options: ["Easy", "Medium", "Hard"], required: true },
 { id: "language", type: "select", label: "Language", options: ["Python", "C++", "Java", "Go", "TypeScript"], required: false },
 { id: "meet_url", type: "url", label: "Meet / Discord Link", required: true }
 ],
 },
 {
 name: "Resources",
 desc: "Share files like lecture notes, slides, cheat sheets, or manuals",
 icon: "book-open",
 schema: [
 { id: "file", type: "file", label: "Resource File", required: true },
 { id: "course", type: "text", label: "Course Code", required: false },
 { id: "notes", type: "text", label: "Description / Notes", required: false }
 ],
 },
 {
 name: "Food Group-Buy",
 desc: "Order bulk food delivery to hostels to save shipping",
 icon: "utensils",
 schema: [
 { id: "deadline", type: "datetime", label: "Order By", required: true },
 { id: "min_order", type: "currency", label: "Min Order for Free Delivery (₹)", required: false },
 { id: "pickup", type: "text", label: "Hostel Pick-up Point", required: true }
 ],
 }
];

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
 const { data: user } = useAuth();
 const { open: openAuthModal } = useAuthModal();
 const { setActiveChamberId, setActiveChannelId } = useCreatePostModal();
 const chambers = chambersData || [];
 const chamber = chambers.find((c) => c.uid === chamberId);
 const { mutate: deleteQn } = useDeleteQuestion();
 const deleteChamberMutation = useDeleteChamber();
 const [isDeleteOpen, setIsDeleteOpen] = useState(false);

 // Channels state
 const { data: channelsData = [], isLoading: isChannelsLoading } = useListChannels(chamberId || "");
 const [selectedChannelUid, setSelectedChannelUid] = useState<string>("");
 const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

 // Create Channel Form State
 const [newChannelName, setNewChannelName] = useState("");
 const [newChannelIcon, setNewChannelIcon] = useState("message-square");
 const [newChannelSchema, setNewChannelSchema] = useState<any[]>([]);
 const { mutate: createChan, isPending: isCreateChanPending } = useCreateChannel(chamberId || "");

 // Search, Sort, Filter state
 const [searchVal, setSearchVal] = useState("");
 const [debouncedSearch, setDebouncedSearch] = useState("");
 const [sortBy, setSortBy] = useState<"time_created" | "votes" | "hot">("hot");
 const [postScope, setPostScope] = useState<"all" | "my-posts">("all");

 const virtualAllChannel = { uid: "all", name: "all", icon: "hash", schema: [] };
 const channels = [virtualAllChannel, ...channelsData];
 const selectedChannel = channels.find((c) => c.uid === selectedChannelUid) || virtualAllChannel;

 useEffect(() => {
 setActiveChamberId(chamberId);
 return () => {
 setActiveChamberId(undefined);
 };
 }, [chamberId, setActiveChamberId]);

 useEffect(() => {
 const composeChannelUid = selectedChannelUid === "all"
 ? (channelsData.find((c: any) => c.name === "discussion")?.uid || channelsData.find((c: any) => c.name === "discussions")?.uid)
 : selectedChannelUid;
 setActiveChannelId(composeChannelUid);
 return () => {
 setActiveChannelId(undefined);
 };
 }, [selectedChannelUid, channelsData, setActiveChannelId]);

 useEffect(() => {
 setSelectedChannelUid("all");
 }, [chamberId]);

 useEffect(() => {
 if (!selectedChannelUid && channelsData.length > 0) {
 setSelectedChannelUid("all");
 }
 }, [channelsData, selectedChannelUid]);

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
 undefined, // postType filter removed in favor of channel separation
 false,
 debouncedSearch || undefined,
 selectedChannel?.uid === "all" ? undefined : selectedChannel?.uid
 );
 const questions = questionsData ? questionsData.pages.flat() : [];
 const { data: pinnedPosts = [] } = usePinnedQuestionsQuery(
 chamberId,
 undefined,
 selectedChannel?.uid === "all" ? undefined : selectedChannel?.uid
 );

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
 <div className="max-w-[56rem] w-full md:mt-24 mt-16 px-4 space-y-8">
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

 const handleSelectTemplate = (tpl: typeof TEMPLATES[number]) => {
 setNewChannelName(tpl.name.toLowerCase().replace(/\s+/g, "-"));
 setNewChannelIcon(tpl.icon);
 setNewChannelSchema([...tpl.schema]);
 };

 const handleAddField = () => {
 setNewChannelSchema((prev) => [
 ...prev,
 { id: `field_${Date.now()}`, type: "text", label: "New Field", required: false }
 ]);
 };

 const handleUpdateField = (index: number, updates: any) => {
 setNewChannelSchema((prev) => {
 const copy = [...prev];
 copy[index] = { ...copy[index], ...updates };
 return copy;
 });
 };

 const handleRemoveField = (index: number) => {
 setNewChannelSchema((prev) => prev.filter((_, i) => i !== index));
 };

 const handleCreateChannelSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newChannelName.trim()) {
 toast.error("Channel name is required");
 return;
 }
 createChan(
 {
 name: newChannelName,
 icon: newChannelIcon,
 schema: newChannelSchema,
 },
 {
 onSuccess: (newChan) => {
 setIsCreateChannelOpen(false);
 setNewChannelName("");
 setNewChannelSchema([]);
 setSelectedChannelUid(newChan.uid);
 toast.success("Channel created!");
 },
 onError: () => {
 toast.error("Failed to create channel");
 }
 }
 );
 };

 return (
 <PageTransition className="max-w-[56rem] w-full md:mt-24 mt-16 pb-36 md:pb-16 relative px-4">
 <button
 onClick={() => navigate(-1)}
 className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-6 transition-colors cursor-pointer"
 >
 <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
 Back
 </button>

 {/* Header Info */}
 <div className="flex items-start gap-4 mb-8 pb-6 border-b border-neutral-100 dark:border-neutral-900">
 <div
 className={cn(
 "size-16 rounded-2xl flex items-center justify-center text-white text-xl shrink-0 ",
 colorClass,
 )}
 >
 {getInitials(chamber.name)}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h1 className="text-xl text-neutral-900 dark:text-neutral-100">
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
 className="rounded-full h-8 px-4 text-xs cursor-pointer border-neutral-200 dark:border-neutral-800"
 onClick={() => setIsEditOpen(true)}
 >
 <HugeiconsIcon icon={PencilEdit02Icon} className="mr-1 size-4 text-neutral-500" />
 Edit
 </Button>
 <Button
 variant="outline"
 className="rounded-full h-8 px-4 text-xs cursor-pointer border-neutral-200 dark:border-neutral-800 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
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
 "rounded-full h-8 px-4 text-xs cursor-pointer border-none ",
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

 {/* Grid: Columns channels and feed */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
 {/* Left Column: Channels List */}
 <div className="md:col-span-1 md:sticky md:top-24 space-y-4">
 <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
 <span>Channels</span>
 {canPin && (
 <button
 onClick={() => setIsCreateChannelOpen(true)}
 className="hover:text-[#ff5a1f] transition-colors cursor-pointer"
 title="Create Channel"
 >
 <Plus className="size-3.5" />
 </button>
 )}
 </div>
 {isChannelsLoading ? (
 <div className="space-y-2">
 <Skeleton className="h-8 w-full rounded-xl" />
 <Skeleton className="h-8 w-full rounded-xl" />
 <Skeleton className="h-8 w-full rounded-xl" />
 </div>
 ) : (
 <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
 {channels.map((ch) => {
 const isSelected = selectedChannel?.uid === ch.uid;
 return (
 <button
 key={ch.uid}
 onClick={() => { haptic(); setSelectedChannelUid(ch.uid); }}
 className={cn(
 "flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap md:w-full text-left",
 isSelected
 ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 "
 : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/30"
 )}
 >
 <span className="text-[#ff5a1f] font-semibold select-none mr-0.5">#</span>
 <span>{ch.name}</span>
 </button>
 );
 })}
 </div>
 )}
 </div>

 {/* Right Column: Feed */}
 <div className="md:col-span-3 space-y-6">
 {/* Active Channel Label for Mobile */}
 <div className="md:hidden flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-900 pb-2 mb-2">
 <span className="text-xs text-neutral-400 uppercase">Viewing:</span>
 <span className="text-sm text-neutral-800 dark:text-neutral-200">
 #{selectedChannel?.name || "discussion"}
 </span>
 </div>

 {/* Search Input Bar (No Outer Box) */}
 <div className="relative w-full">
 <HugeiconsIcon
 icon={Search01Icon}
 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500"
 />
 <input
 type="text"
 placeholder={`Search in #${selectedChannel?.name || "channel"}...`}
 value={searchVal}
 onChange={(e) => setSearchVal(e.target.value)}
 className="w-full h-10 pl-10 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background/50 dark:bg-background/20 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-all "
 />
 {searchVal && (
 <button
 onClick={() => setSearchVal("")}
 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors text-xs cursor-pointer border-none bg-transparent flex items-center justify-center"
 >
 ✕
 </button>
 )}
 </div>



 {/* Filters and Sort Row */}
 <div className="flex items-center gap-2 flex-wrap">
  {/* Sort By Dropdown */}
  <DropdownMenu>
  <DropdownMenuTrigger className="flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background size-8.5 bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-300 cursor-pointer focus:outline-none" title={`Sort: ${sortBy === "hot" ? "Hot" : sortBy === "time_created" ? "Recent" : "Top Posts"}`}>
    {sortBy === "hot" ? (
      <Flame className="size-4 text-[#ff5a1f]" />
    ) : sortBy === "time_created" ? (
      <Clock className="size-4" />
    ) : (
      <Star className="size-4" />
    )}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start" className="min-w-[130px]">
  <DropdownMenuItem onClick={() => setSortBy("hot")} className="cursor-pointer flex items-center gap-2 text-xs">
    <Flame className="size-3.5 text-[#ff5a1f]" />
    Hot
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setSortBy("time_created")} className="cursor-pointer flex items-center gap-2 text-xs">
    <Clock className="size-3.5" />
    Recent
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setSortBy("votes")} className="cursor-pointer flex items-center gap-2 text-xs">
    <Star className="size-3.5" />
    Top Posts
  </DropdownMenuItem>
  </DropdownMenuContent>
  </DropdownMenu>

  {/* Scope Filter */}
  {user && (
  <DropdownMenu>
  <DropdownMenuTrigger className="flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background size-8.5 bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-300 cursor-pointer focus:outline-none" title={`Scope: ${postScope === "all" ? "All authors" : "My posts"}`}>
    {postScope === "all" ? (
      <Globe className="size-4" />
    ) : (
      <User className="size-4 text-[#ff5a1f]" />
    )}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start" className="min-w-[130px]">
  <DropdownMenuItem onClick={() => setPostScope("all")} className="cursor-pointer flex items-center gap-2 text-xs">
    <Globe className="size-3.5" />
    All authors
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setPostScope("my-posts")} className="cursor-pointer flex items-center gap-2 text-xs">
    <User className="size-3.5 text-[#ff5a1f]" />
    My posts
  </DropdownMenuItem>
  </DropdownMenuContent>
  </DropdownMenu>
  )}
  </div>

 {/* Pinned Posts Carousel */}
 {pinnedPosts.length > 0 && !debouncedSearch && (
 <div className="space-y-2">
 <div className="flex items-center gap-1.5 px-1 text-[11px] text-neutral-400 dark:text-neutral-500">
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
 <div className="text-center py-12 text-neutral-500 bg-neutral-50/10 border border-dashed border-neutral-200 dark:border-neutral-850 rounded-2xl p-6">
 <p className="text-sm font-medium">No posts in this channel yet.</p>
 <p className="text-xs text-neutral-400 mt-1">
 {chamber.isJoined ? "Be the first to share your thoughts in this channel!" : "Join this chamber to share your first post!"}
 </p>
 </div>
 )}
 </div>
 </div>
 </div>

 {canPin && chamber.uid && (
 <EditChamberDialog
 open={isEditOpen}
 onOpenChange={setIsEditOpen}
 chamber={chamber}
 />
 )}

 {/* Delete Chamber Dialog */}
 <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Delete Chamber</DialogTitle>
 </DialogHeader>
 <p className="text-sm text-neutral-500">
 Are you sure you want to delete <strong>{chamber?.name}</strong>? This will permanently remove the chamber, all channels, and all posts. This action cannot be undone.
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

 {/* Create Channel Dialog */}
 <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
 <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto scrollbar-modern">
 <DialogHeader>
 <DialogTitle className="text-sm ">Create a Channel</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleCreateChannelSubmit} className="space-y-5 py-2">
 {/* Template Selector */}
 <div className="space-y-1.5">
 <label className="text-[10px] text-neutral-400 uppercase tracking-wide">
 Start with a Template
 </label>
 <div className="grid grid-cols-2 gap-2">
 {TEMPLATES.map((tpl) => {
 const IconComp = ICON_MAP[tpl.icon] || Hash;
 return (
 <button
 key={tpl.name}
 type="button"
 onClick={() => handleSelectTemplate(tpl)}
 className="flex flex-col items-start p-3 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-background/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 rounded-xl text-left transition-all cursor-pointer"
 >
 <div className="flex items-center gap-1.5 text-xs text-neutral-900 dark:text-neutral-200">
 <IconComp className="size-3.5 text-[#ff5a1f]" />
 {tpl.name}
 </div>
 <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 leading-normal">
 {tpl.desc}
 </p>
 </button>
 );
 })}
 </div>
 </div>

 {/* General Properties */}
 <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-900">
 <div>
 <label className="text-[10px] text-neutral-400 uppercase tracking-wide">
 Channel Name
 </label>
 <Input
 placeholder="e.g. textbook-swap"
 value={newChannelName}
 onChange={(e) => setNewChannelName(e.target.value)}
 className="rounded-xl mt-1 h-9 text-xs"
 />
 </div>

 <div>
 <label className="text-[10px] text-neutral-400 uppercase tracking-wide">
 Channel Icon
 </label>
 <div className="flex gap-2 flex-wrap mt-1">
 {Object.keys(ICON_MAP).map((iconName) => {
 const IconComp = ICON_MAP[iconName];
 const isSelected = newChannelIcon === iconName;
 return (
 <button
 key={iconName}
 type="button"
 onClick={() => setNewChannelIcon(iconName)}
 className={cn(
 "size-8 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-800 transition-all cursor-pointer",
 isSelected
 ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
 : "bg-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
 )}
 >
 <IconComp className="size-4" />
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* Schema Custom Fields Editor */}
 <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-900">
 <div className="flex items-center justify-between">
 <label className="text-[10px] text-neutral-400 uppercase tracking-wide">
 Custom Data Fields
 </label>
 <button
 type="button"
 onClick={handleAddField}
 className="text-xs text-[#ff5a1f] hover:text-[#e94a12] flex items-center gap-1 cursor-pointer"
 >
 <PlusCircle className="size-3.5" />
 Add Field
 </button>
 </div>

 {newChannelSchema.length === 0 ? (
 <p className="text-[11px] text-neutral-400">
 No custom fields. This channel will use standard text discussions.
 </p>
 ) : (
 <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 scrollbar-modern">
 {newChannelSchema.map((field, idx) => (
 <div
 key={field.id}
 className="flex items-center gap-2 p-2 border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/20 dark:bg-neutral-900/10 rounded-xl"
 >
 <input
 type="text"
 placeholder="Label"
 value={field.label}
 onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
 className="flex-1 h-7 text-[11px] px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background text-neutral-800 dark:text-neutral-200 focus:outline-none"
 />
 <DropdownMenu>
 <DropdownMenuTrigger className="h-7 text-[10px] px-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-background text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer inline-flex items-center gap-1.5 min-w-[70px] justify-between">
 <span>{field.type === "currency" ? "Currency" : field.type === "datetime" ? "Date-Time" : field.type === "file" ? "File Upload" : field.type.charAt(0).toUpperCase() + field.type.slice(1)}</span>
 <HugeiconsIcon icon={ArrowDown01Icon} className="size-2 text-neutral-400" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="min-w-[100px]">
 <DropdownMenuItem onClick={() => handleUpdateField(idx, { type: "text" })} className="text-[11px] cursor-pointer">Text</DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleUpdateField(idx, { type: "number" })} className="text-[11px] cursor-pointer">Number</DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleUpdateField(idx, { type: "currency" })} className="text-[11px] cursor-pointer">Currency</DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleUpdateField(idx, { type: "select" })} className="text-[11px] cursor-pointer">Dropdown</DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleUpdateField(idx, { type: "datetime" })} className="text-[11px] cursor-pointer">Date-Time</DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleUpdateField(idx, { type: "url" })} className="text-[11px] cursor-pointer">Link</DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleUpdateField(idx, { type: "file" })} className="text-[11px] cursor-pointer">File Upload</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 {field.type === "select" && (
 <input
 type="text"
 placeholder="Options (comma separated)"
 value={field.options?.join(",") || ""}
 onChange={(e) =>
 handleUpdateField(idx, {
 options: e.target.value.split(",").map((o) => o.trim()),
 })
 }
 className="w-24 h-7 text-[10px] px-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background text-neutral-800 dark:text-neutral-200 focus:outline-none"
 />
 )}

 <div 
 onClick={() => handleUpdateField(idx, { required: !field.required })}
 className="flex items-center gap-1.5 text-[10px] text-neutral-400 select-none cursor-pointer"
 >
 <div
 className={cn(
 "size-4 rounded-md border flex items-center justify-center transition-all",
 field.required
 ? "bg-[#ff5a1f] border-[#ff5a1f] text-white"
 : "border-neutral-300 dark:border-neutral-700 bg-transparent hover:border-neutral-400"
 )}
 >
 {field.required && (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" className="size-2.5">
 <polyline points="20 6 9 17 4 12" />
 </svg>
 )}
 </div>
 <span>Req</span>
 </div>

 <button
 type="button"
 onClick={() => handleRemoveField(idx)}
 className="p-1 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
 >
 <Trash2 className="size-3.5" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>

 <DialogFooter className="pt-2">
 <DialogClose render={<Button variant="outline" type="button" className="rounded-xl h-9 text-xs" />}>
 Cancel
 </DialogClose>
 <Button
 type="submit"
 disabled={isCreateChanPending || !newChannelName.trim()}
 className="bg-[#ff5a1f] hover:bg-[#e94a12] text-white rounded-xl h-9 text-xs border-none cursor-pointer"
 >
 {isCreateChanPending ? "Creating..." : "Create Channel"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 </PageTransition>
 );
}
