import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  ArrowLeft02Icon,
  Calendar03Icon,
  Pin02Icon,
  Search01Icon,
  PencilEdit02Icon,
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
  useUpdateChannel,
  useDeleteChannel,
} from "@/hooks/use-chamber";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { cn } from "@/lib/utils";
import { ChamberAvatar } from "@/components/ui/chamber-avatar";
import {
  useDeleteQuestion,
  useInfiniteQuestionsQuery,
  usePinnedQuestionsQuery,
} from "@/hooks/use-questions";
import { PageTransition } from "@/components/page-transition";
import { EmptyState } from "@/components/ui/dashed-empty-state";
import { EditChamberDialog } from "@/components/chambers/edit-chamber-dialog";
import { SchemaEditor } from "@/components/chambers/schema-editor";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/menu";
import { useWebHaptics } from "@/lib/haptic";
import { useCreatePostModal } from "@/hooks/use-create-post-modal";
import { Input } from "@/components/ui/input";
import { handleApiError } from "@/lib/api-error";
import { toastManager } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import {
  Plus,
  Trash2,
  Flame,
  Clock,
  Star,
  Globe,
  User,
  Pencil,
  UserPlus,
  UserCheck,
} from "lucide-react";

const DEFAULT_CHANNEL_SCHEMA = [
  { id: "standard_image", type: "image", label: "Image Photo", required: 0 },
  { id: "standard_poll", type: "poll", label: "Poll", required: 0 },
  { id: "standard_currency", type: "currency", label: "Price", required: 0 },
  { id: "standard_datetime", type: "datetime", label: "Date-Time", required: 0 },
  { id: "standard_file", type: "file", label: "File", required: 0 },
  { id: "standard_location", type: "location", label: "Location", required: 0 },
  { id: "standard_source_destination", type: "source_destination", label: "Source → Destination", required: 0 },
  { id: "standard_key_value", type: "key_value", label: "Key:Value", required: 0 },
  { id: "standard_button", type: "button", label: "DM Button", required: 0 },
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
  const chamber = chambers.find(
    (c) => c.slug === chamberId || c.name.toLowerCase() === chamberId?.toLowerCase() || c.uid === chamberId,
  );
  const { mutate: deleteQn } = useDeleteQuestion();
  const deleteChamberMutation = useDeleteChamber();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Channels state
  const { data: channelsData = [], isLoading: isChannelsLoading } =
    useListChannels(chamber?.uid || "");
  const [selectedChannelUid, setSelectedChannelUid] = useState<string>("");
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelSchema, setNewChannelSchema] = useState<any[]>(DEFAULT_CHANNEL_SCHEMA);
  const { mutate: createChan, isPending: isCreateChanPending } =
    useCreateChannel(chamber?.uid || "");

  const [editingChannel, setEditingChannel] = useState<any | null>(null);
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [editChannelName, setEditChannelName] = useState("");
  const [editChannelSchema, setEditChannelSchema] = useState<any[]>([]);
  const updateChannelMutation = useUpdateChannel(chamber?.uid || "");
  const deleteChannelMutation = useDeleteChannel(chamber?.uid || "");

  const { trigger } = useWebHaptics();

  useEffect(() => {
    if (editingChannel) {
      setEditChannelName(editingChannel.name);
      setEditChannelSchema(editingChannel.schema || []);
    }
  }, [editingChannel]);

  const handleEditChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editChannelName.trim()) {
      toastManager.add({ title: "Channel name is required", type: "error" });
      return;
    }
    if (!editingChannel?.uid) return;

    updateChannelMutation.mutate(
      {
        channelUid: editingChannel.uid,
        channel: {
          name: editChannelName,
          schema: editChannelSchema,
        },
      },
      {
        onSuccess: () => {
          setIsEditChannelOpen(false);
          setEditingChannel(null);
          toastManager.add({ title: "Channel updated!", type: "success" });
        },
        onError: (err) => {
          handleApiError(err, "Failed to update channel");
        },
      },
    );
  };

  const handleDeleteChannel = () => {
    if (!editingChannel?.uid) return;
    if (
      editingChannel.name === "discussion" ||
      editingChannel.name === "discussions"
    ) {
      toastManager.add({ title: "Cannot delete default discussion channel", type: "error" });
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete #${editingChannel.name}? This will delete all posts in this channel.`,
      )
    ) {
      deleteChannelMutation.mutate(editingChannel.uid, {
        onSuccess: () => {
          setIsEditChannelOpen(false);
          setEditingChannel(null);
          setSelectedChannelUid("all");
          toastManager.add({ title: "Channel deleted!", type: "success" });
        },
        onError: (err) => {
          handleApiError(err, "Failed to delete channel");
        },
      });
    }
  };

  // Search, Sort, Filter state
  const [searchVal, setSearchVal] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"time_created" | "votes" | "hot">("hot");
  const [postScope, setPostScope] = useState<"all" | "my-posts">("all");

  const virtualAllChannel = {
    uid: "all",
    name: "all",
    icon: "hash",
    schema: [],
  };
  const channels = [virtualAllChannel, ...channelsData];
  const selectedChannel =
    channels.find((c) => c.uid === selectedChannelUid) || virtualAllChannel;

  useEffect(() => {
    setActiveChamberId(chamber?.uid);
    return () => {
      setActiveChamberId(undefined);
    };
  }, [chamber?.uid, setActiveChamberId]);

  useEffect(() => {
    const composeChannelUid =
      selectedChannelUid === "all"
        ? channelsData.find((c: any) => c.name === "discussion")?.uid ||
          channelsData.find((c: any) => c.name === "discussions")?.uid
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
    chamber?.uid,
    postScope === "my-posts" ? user?.username : undefined,
    20,
    undefined, // postType filter removed in favor of channel separation
    false,
    debouncedSearch || undefined,
    selectedChannel?.uid === "all" ? undefined : selectedChannel?.uid,
  );
  const questions = questionsData ? questionsData.pages.flat() : [];
  const { data: pinnedPosts = [] } = usePinnedQuestionsQuery(
    chamber?.uid,
    undefined,
    selectedChannel?.uid === "all" ? undefined : selectedChannel?.uid,
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
        { threshold: 0, rootMargin: "200px" },
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

  const handleToggleJoin = () => {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    if (!chamber?.uid) return;
    if (chamber.isJoined) {
      leaveMutation.mutate(chamber.uid, {
        onError: (err) => handleApiError(err, "Failed to leave chamber"),
      });
    } else {
      joinMutation.mutate(chamber.uid, {
        onError: (err) => handleApiError(err, "Failed to join chamber"),
      });
    }
  };

  const canPin = !!user?.username && user.username === chamber.creatorUsername;

  const handleCreateChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      toastManager.add({ title: "Channel name is required", type: "error" });
      return;
    }
    createChan(
      {
        name: newChannelName,
        schema: newChannelSchema,
      },
      {
        onSuccess: (newChan) => {
          setIsCreateChannelOpen(false);
          setNewChannelName("");
          setNewChannelSchema([...DEFAULT_CHANNEL_SCHEMA]);
          setSelectedChannelUid(newChan.uid);
          toastManager.add({ title: "Channel created!", type: "success" });
        },
        onError: (err) => {
          handleApiError(err, "Failed to create channel");
        },
      },
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
        <ChamberAvatar
          name={chamber.name}
          picture={chamber.picture}
          icon={chamber.icon}
          colorIndex={chamber.colorIndex ?? 0}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl text-neutral-900 dark:text-neutral-100">
              {chamber.name}
            </h1>
          </div>
          <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
            {chamber.description}
          </p>
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-3 text-xs text-neutral-400 dark:text-neutral-500">
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
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="cursor-pointer"
                      onClick={() => setIsEditOpen(true)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  }
                />
                <TooltipContent side="top">Edit Chamber</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="destructive-outline"
                      size="icon-sm"
                      onClick={() => setIsDeleteOpen(true)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                />
                <TooltipContent side="top">Delete Chamber</TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={chamber.isJoined ? "outline" : "default"}
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => {
                    chamber.isJoined ? trigger("warning") : trigger("success");
                    handleToggleJoin();
                  }}
                >
                  {chamber.isJoined ? (
                    <UserCheck className="size-4" />
                  ) : (
                    <UserPlus className="size-4" />
                  )}
                </Button>
              }
            />
            <TooltipContent side="top">
              {chamber.isJoined ? "Joined (Click to leave)" : "Join Chamber"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Grid: Columns channels and feed */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Left Column: Channels List */}
        <div className="md:col-span-1 md:sticky md:top-24 space-y-4">
          <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            <span>Channels</span>
            {canPin && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      onClick={() => setIsCreateChannelOpen(true)}
                      className="hover:text-[var(--brand)] transition-colors cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  }
                />
                <TooltipContent side="top">Create Channel</TooltipContent>
              </Tooltip>
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
                  <div
                    key={ch.uid}
                    className={cn(
                      "group/chan flex items-center justify-between px-3.5 py-2 rounded-xl text-sm transition-all whitespace-nowrap md:w-full text-left cursor-pointer",
                      isSelected
                        ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 "
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/30",
                    )}
                    onClick={() => {
                      trigger("selection");
                      setSelectedChannelUid(ch.uid);
                    }}
                  >
                    <div className="flex items-center min-w-0">
                      <span className="text-[var(--brand)] select-none mr-0.5">
                        #
                      </span>
                      <span className="truncate">{ch.name}</span>
                    </div>
                    {canPin && ch.uid !== "all" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          trigger("light");
                          setEditingChannel(ch);
                          setIsEditChannelOpen(true);
                        }}
                        className="opacity-0 group-hover/chan:opacity-100 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-all cursor-pointer size-5 flex items-center justify-center shrink-0"
                        aria-label="Edit channel"
                      >
                        <HugeiconsIcon
                          icon={PencilEdit02Icon}
                          className="size-3"
                        />
                      </button>
                    )}
                  </div>
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
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500 pointer-events-none"
            />
            <Input
              placeholder={`Search in #${selectedChannel?.name || "channel"}...`}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="rounded-full border-neutral-200 dark:border-neutral-800 bg-[#F5F5F5] dark:bg-neutral-800/50"
              style={{ paddingLeft: "2.5rem", paddingRight: "2rem" }}
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
              <DropdownMenuTrigger className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background px-3 h-8.5 gap-1.5 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer focus:outline-none">
                {sortBy === "hot" ? (
                  <Flame className="size-4" />
                ) : sortBy === "time_created" ? (
                  <Clock className="size-4" />
                ) : (
                  <Star className="size-4" />
                )}
                <span>
                  {sortBy === "hot"
                    ? "Hot"
                    : sortBy === "time_created"
                      ? "Recent"
                      : "Top Posts"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[130px]">
                <DropdownMenuItem
                  onClick={() => setSortBy("hot")}
                  className="cursor-pointer flex items-center gap-2 text-xs"
                >
                  <Flame className="size-3.5" />
                  Hot
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("time_created")}
                  className="cursor-pointer flex items-center gap-2 text-xs"
                >
                  <Clock className="size-3.5" />
                  Recent
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("votes")}
                  className="cursor-pointer flex items-center gap-2 text-xs"
                >
                  <Star className="size-3.5" />
                  Top Posts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Scope Filter */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background px-3 h-8.5 gap-1.5 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer focus:outline-none">
                  {postScope === "all" ? (
                    <Globe className="size-4" />
                  ) : (
                    <User className="size-4 text-[var(--brand)]" />
                  )}
                  <span>
                    {postScope === "all" ? "All authors" : "My posts"}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[130px]">
                  <DropdownMenuItem
                    onClick={() => setPostScope("all")}
                    className="cursor-pointer flex items-center gap-2 text-xs"
                  >
                    <Globe className="size-3.5" />
                    All authors
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPostScope("my-posts")}
                    className="cursor-pointer flex items-center gap-2 text-xs"
                  >
                    <User className="size-3.5 text-[var(--brand)]" />
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
                <HugeiconsIcon
                  icon={Pin02Icon}
                  className="size-3.5 text-[var(--brand)]"
                />
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
                <div className="border border-neutral-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden">
                  <QuestionList
                    questions={questions}
                    onDelete={(id) => deleteQn(id)}
                    canPin={canPin}
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
            ) : (
              <EmptyState
                title="No posts in this channel yet"
                description={
                  chamber.isJoined
                    ? "Be the first to share your thoughts in this channel!"
                    : "Join this chamber to share your first post!"
                }
              />
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
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Delete Chamber</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{chamber?.name}</strong>?
              This will permanently remove the chamber, all channels, and all
              posts. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              disabled={deleteChamberMutation.isPending}
              onClick={() => {
                if (!chamber?.name) return;
                deleteChamberMutation.mutate(chamber.name, {
                  onSuccess: () => {
                    navigate("/");
                  },
                  onError: (err) => {
                    handleApiError(err, "Failed to delete chamber");
                  },
                });
              }}
            >
              {deleteChamberMutation.isPending
                ? "Deleting..."
                : "Delete Chamber"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* Create Channel Dialog */}
      <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
        <DialogPopup className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Create a Channel</DialogTitle>
          </DialogHeader>
          <DialogPanel className="space-y-5 px-6">
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
                />
              </div>
            </div>

            <SchemaEditor
              fields={newChannelSchema}
              onChange={setNewChannelSchema}
            />
          </DialogPanel>

          <DialogFooter variant="bare">
            <DialogClose
              render={<Button variant="outline" type="button" />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="default"
              type="submit"
              onClick={handleCreateChannelSubmit}
              disabled={isCreateChanPending || !newChannelName.trim()}
            >
              {isCreateChanPending ? "Creating..." : "Create Channel"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* Edit Channel Dialog */}
      <Dialog open={isEditChannelOpen} onOpenChange={setIsEditChannelOpen}>
        <DialogPopup className="sm:max-w-[640px] max-sm:mb-4">
          <DialogHeader>
            <DialogTitle>Edit Channel: #{editingChannel?.name}</DialogTitle>
          </DialogHeader>
          <DialogPanel className="space-y-5 px-6">
            {/* General Properties */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-wide">
                  Channel Name
                </label>
                <Input
                  placeholder="e.g. textbook-swap"
                  value={editChannelName}
                  onChange={(e) => setEditChannelName(e.target.value)}
                />
              </div>
            </div>

            <SchemaEditor
              fields={editChannelSchema}
              onChange={setEditChannelSchema}
            />
          </DialogPanel>

          <DialogFooter className="!px-6 mt-4" variant="bare">
            <div className="flex w-full flex-wrap gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteChannel}
                disabled={deleteChannelMutation.isPending}
              >
                {deleteChannelMutation.isPending
                  ? "Deleting..."
                  : "Delete Channel"}
              </Button>
              <div className="flex gap-2 ml-auto">
                <DialogClose
                  render={<Button variant="outline" type="button" />}
                >
                  Cancel
                </DialogClose>
                <Button
                  variant="default"
                  type="submit"
                  onClick={handleEditChannelSubmit}
                  disabled={
                    updateChannelMutation.isPending || !editChannelName.trim()
                  }
                >
                  {updateChannelMutation.isPending
                    ? "Saving..."
                    : "Save"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </PageTransition>
  );
}
