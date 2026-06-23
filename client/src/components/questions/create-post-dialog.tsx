import { useRef, useState } from "react";
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
import { Add01Icon, ArrowDown01Icon, Image01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { uploadImagePresigned } from "@/api/upload";
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
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedChamber, setSelectedChamber] = useState<string>("");
  const { mutate: submitQuestion, isPending: isCreatePending } = useCreateQuestion();
  const [isValidating, setIsValidating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
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
  const selectedChamberData = JOINED_CHAMBERS.find((c) => c.uid === selectedChamber);

  const handleUploadImages = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 4 - images.length;
    if (remaining <= 0) {
      toast.error("Max 4 images per post");
      return;
    }
    setImageUploading(true);
    const toUpload = Array.from(files).slice(0, remaining);
    const urls: string[] = [];
    for (const file of toUpload) {
      try {
        const url = await uploadImagePresigned(file);
        urls.push(url);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setImages((prev) => [...prev, ...urls]);
    setImageUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const fullContent = draft.content + (images.length > 0 ? "\n" + images.join("\n") : "");
    if (!fullContent.trim() || !selectedChamber || isCreatePending || isValidating) return;

    setIsValidating(true);
    try {
      const result = await validateMentions(draft.content);
      if (result.missing.length > 0) {
        toast.error(`User not found: ${result.missing.join(", ")}`);
        setIsValidating(false);
        return;
      }

      const payload = {
        content: fullContent,
        chamberUid: selectedChamber,
        postType,
        ...(postType === "partner" ? { partnerSlotsNeeded: Number(partnerSlotsNeeded) } : {}),
        ...(postType === "trade" ? { tradePrice: tradePrice ? Math.round(Number(tradePrice) * 100) : 0, tradeCondition } : {}),
        ...(postType === "taxi" ? { taxiDeparture, taxiDestination, taxiDatetime } : {}),
        ttlHours,
      };

      submitQuestion(payload, {
        onSuccess: () => {
          resetDraft();
          setImages([]);
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
        onSettled: () => setIsValidating(false),
      });
    } catch {
      toast.error("Failed to validate mentions");
      setIsValidating(false);
    }
  };

  if (!hasToken || !user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { if (!val) close(); }}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-background rounded-2xl">
        <DialogHeader className="px-5 pt-4 pb-2">
          <DialogTitle className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Create a Post
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-4 space-y-3">
          <div className="flex items-start gap-3">
            <UserAvatar
              src={user.avatar}
              name={user.username}
              className="size-9 mt-0.5 shrink-0"
            />
            <div className="flex-1 space-y-3">
              <div className="bg-transparent transition-colors space-y-3">
                <MentionField
                  placeholder="What's on your mind?"
                  ariaLabel="Post content"
                  className="resize-none min-h-[100px] border-none shadow-none focus-visible:ring-0 bg-transparent p-0 text-sm focus:outline-none rounded-none"
                  value={draft.content}
                  onValueChange={(value) => updateDraft({ content: value })}
                  multiline
                />

                {/* Image previews - smaller, transparent background, and floating delete button */}
                {images.length > 0 && (
                  <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none bg-transparent">
                    {images.map((url, i) => (
                      <div key={i} className="relative shrink-0 group transition-transform hover:scale-105">
                        <img src={url} alt="" className="size-12 rounded-xl object-cover shadow-sm border border-neutral-200/50 dark:border-neutral-700/50" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-1 -right-1 size-4 rounded-full bg-neutral-900/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm border border-white dark:border-neutral-800"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 py-1 bg-transparent overflow-x-auto scrollbar-none">
                  {(["qna", "partner", "trade", "taxi"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPostType(type)}
                      className={cn(
                        "h-6 px-2.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer border whitespace-nowrap",
                        postType === type
                          ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                          : "bg-neutral-100 dark:bg-neutral-800/60 text-neutral-500 border-transparent hover:text-neutral-700 dark:hover:text-neutral-300",
                      )}
                    >
                      {type === "qna" ? "Discussion" : type === "partner" ? "Partner" : type === "trade" ? "Marketplace" : "Taxi"}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 py-1 bg-transparent">
                  {(postType === "partner" || postType === "trade" || postType === "taxi") && (
                    <div className="flex items-center gap-2 flex-wrap py-1.5 border-b border-neutral-100 dark:border-neutral-800/50">
                      {postType === "partner" && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-neutral-500 select-none">Slots</span>
                          <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-background">
                            <button type="button" onClick={() => setPartnerSlotsNeeded(Math.max(1, partnerSlotsNeeded - 1))} className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium cursor-pointer select-none">−</button>
                            <span className="w-6 h-6 flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 border-x border-neutral-200 dark:border-neutral-700 select-none">{partnerSlotsNeeded}</span>
                            <button type="button" onClick={() => setPartnerSlotsNeeded(Math.min(10, partnerSlotsNeeded + 1))} className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium cursor-pointer select-none">+</button>
                          </div>
                        </div>
                      )}
                      {postType === "trade" && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden h-7 bg-background min-w-0">
                            <span className="px-2 text-xs text-neutral-400 font-medium select-none border-r border-neutral-200 dark:border-neutral-700 shrink-0">₹</span>
                            <input type="number" min={0} placeholder="Price" value={tradePrice} onChange={(e) => setTradePrice(e.target.value)} className="w-0 min-w-[60px] flex-1 h-7 text-xs px-2 bg-transparent text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-1.5 h-7 px-2.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors focus:outline-none cursor-pointer border border-neutral-200 dark:border-neutral-700">
                              {tradeCondition === "New"
                                ? "Brand New"
                                : tradeCondition === "Like New"
                                ? "Like New"
                                : tradeCondition === "Used"
                                ? "Used"
                                : "Digital/PDF"}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[120px]">
                              <DropdownMenuItem onClick={() => setTradeCondition("New")} className="cursor-pointer">
                                Brand New
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTradeCondition("Like New")} className="cursor-pointer">
                                Like New
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTradeCondition("Used")} className="cursor-pointer">
                                Used
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTradeCondition("PDF/Digital")} className="cursor-pointer">
                                Digital/PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                      {postType === "taxi" && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input type="text" placeholder="From" value={taxiDeparture} onChange={(e) => setTaxiDeparture(e.target.value)} className="min-w-0 flex-1 min-w-[80px] max-w-[120px] h-7 text-xs px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none" />
                          <span className="text-neutral-400 text-xs shrink-0">→</span>
                          <input type="text" placeholder="To" value={taxiDestination} onChange={(e) => setTaxiDestination(e.target.value)} className="min-w-0 flex-1 min-w-[80px] max-w-[120px] h-7 text-xs px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none" />
                          <DateTimePicker value={taxiDatetime} onChange={setTaxiDatetime} placeholder="Pick date & time" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 flex-wrap pt-3.5 border-t border-neutral-100 dark:border-neutral-800/60">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-1.5 h-8 px-2.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer border border-neutral-200 dark:border-neutral-700 max-w-[140px] truncate">
                          {selectedChamberData ? (
                            <>
                              <div className={cn("size-2 rounded-full", CHAMBER_COLORS[(selectedChamberData.colorIndex || 0) % CHAMBER_COLORS.length])} />
                              {selectedChamberData.name}
                            </>
                          ) : (
                            <>
                              <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-neutral-500" />
                              Chamber
                            </>
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 max-h-[200px] overflow-y-auto scrollbar-thin">
                          {JOINED_CHAMBERS.length > 0 ? JOINED_CHAMBERS.map((chamber, i) => (
                            <DropdownMenuItem key={chamber.uid || i} onClick={() => setSelectedChamber(chamber.uid!)} className="gap-2 cursor-pointer">
                              <div className={cn("size-2.5 rounded-full", CHAMBER_COLORS[(chamber.colorIndex || 0) % CHAMBER_COLORS.length])} />
                              {chamber.name}
                            </DropdownMenuItem>
                          )) : (
                            <div className="px-2 py-1.5 text-xs text-neutral-500">No chambers joined</div>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <button
                        type="button"
                        disabled={imageUploading || images.length >= 4}
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {imageUploading ? (
                          <span className="inline-block size-3.5 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin" />
                        ) : (
                          <HugeiconsIcon icon={Image01Icon} className="size-3.5" />
                        )}
                        {images.length > 0 ? `${images.length}/4` : "Image"}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={imageUploading}
                        onChange={(e) => handleUploadImages(e.target.files)}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
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
                            : "bg-transparent text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:text-neutral-600 dark:hover:text-neutral-300",
                        )}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {ttlHours !== null ? `${ttlHours}h` : "Off"}
                      </button>

                      <Button
                        size="sm"
                        className="bg-[#ff5a1f] hover:bg-[#e94a12] text-white rounded-lg text-xs h-8 px-4 border-none font-semibold cursor-pointer shrink-0"
                        onClick={handleSubmit}
                        disabled={!selectedChamber || !draft.content.trim() || isValidating || isCreatePending}
                      >
                        {isCreatePending ? "Posting..." : "Post"}
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="ml-1.5 size-3.5" />
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
