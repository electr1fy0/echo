import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth, useToken } from "@/hooks/use-auth";
import { useCreateQuestion, useQuestionDraft } from "@/hooks/use-questions";
import { useListChambers } from "@/hooks/use-chamber";
import { validateMentions } from "@/lib/mention-validation";
import { toast } from "@/lib/toast";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionField } from "@/components/ui/mention-field";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Button } from "@/components/ui/button";
import { useCreatePostModal } from "@/hooks/use-create-post-modal";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CreatePostDialog() {
  const { isOpen, close } = useCreatePostModal();
  const { data: user } = useAuth();
  const token = useToken();
  const hasToken = !!token;

  const [selectedChamber, setSelectedChamber] = useState<string>("");
  const { mutate: submitQuestion, isPending: isCreatePending } =
    useCreateQuestion();
  const [isValidating, setIsValidating] = useState(false);
  const { draft, updateDraft, resetDraft } = useQuestionDraft();
  
  const [postType, setPostType] = useState<"qna" | "partner" | "trade" | "taxi">("qna");
  const [partnerSlotsNeeded, setPartnerSlotsNeeded] = useState(1);
  const [tradePrice, setTradePrice] = useState("");
  const [tradeCondition, setTradeCondition] = useState("Like New");
  const [ttlHours, setTtlHours] = useState<number | null>(null);
  const [taxiDeparture, setTaxiDeparture] = useState("");
  const [taxiDestination, setTaxiDestination] = useState("");
  const [taxiDatetime, setTaxiDatetime] = useState("");

  const { data: chambersData } = useListChambers();
  const chambers = chambersData || [];
  const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);
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
          tradePrice: tradePrice ? Math.round(Number(tradePrice) * 100) : 0,
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
            close();
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

  if (!hasToken) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { if (!val) close(); }}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-background rounded-2xl shadow-lg">
        <DialogHeader className="px-5 pt-4 pb-0">
          <DialogTitle className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Create a Post
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <UserAvatar
              src={user?.avatar}
              name={user?.username || "Anonymous"}
              className="size-8 mt-1"
            />
            <div className="flex-1 space-y-3">
              <div className="border border-neutral-200 dark:border-neutral-700 bg-background rounded-xl overflow-hidden focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition-colors">
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
                  className="resize-none min-h-[90px] border-none shadow-none focus-visible:ring-0 bg-transparent px-4 pt-1 pb-2 text-sm"
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
                        "h-6 px-2.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer border whitespace-nowrap",
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
                          <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 select-none">
                            Slots
                          </span>
                          <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-background">
                            <button
                              type="button"
                              onClick={() => setPartnerSlotsNeeded(Math.max(1, partnerSlotsNeeded - 1))}
                              className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium cursor-pointer select-none"
                            >
                              −
                            </button>
                            <span className="w-6 h-6 flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 border-x border-neutral-200 dark:border-neutral-700 select-none">
                              {partnerSlotsNeeded}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPartnerSlotsNeeded(Math.min(10, partnerSlotsNeeded + 1))}
                              className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium cursor-pointer select-none"
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
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-2 h-8 px-2.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer">
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
                      <DropdownMenuContent align="start" className="w-56 max-h-[200px] overflow-y-auto scrollbar-thin">
                        {JOINED_CHAMBERS.length > 0 ? (
                          JOINED_CHAMBERS.map((chamber, i) => (
                            <DropdownMenuItem
                              key={chamber.uid || i}
                              onClick={() => setSelectedChamber(chamber.uid!)}
                              className="gap-2 cursor-pointer"
                            >
                              <div
                                className={cn(
                                  "size-2.5 rounded-full",
                                  CHAMBER_COLORS[
                                    (chamber.colorIndex || 0) % CHAMBER_COLORS.length
                                  ],
                                )}
                              />
                              {chamber.name}
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-xs text-neutral-500">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
