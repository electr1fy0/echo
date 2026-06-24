import { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth, useToken } from "@/hooks/use-auth";
import { useCreateQuestion, useQuestionDraft } from "@/hooks/use-questions";
import { useListChambers, useListChannels } from "@/hooks/use-chamber";
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
import { Edit01Icon, ArrowDown01Icon, Image01Icon, Delete02Icon, HourglassIcon } from "@hugeicons/core-free-icons";
import { uploadImagePresigned } from "@/api/upload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Hash, Layers } from "lucide-react";

export function CreatePostDialog() {
  const { isOpen, close, defaultChamberId, defaultChannelId, activeChamberId, activeChannelId } = useCreatePostModal();
  const { data: user } = useAuth();
  const token = useToken();
  const hasToken = !!token;
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedChamber, setSelectedChamber] = useState<string>("");
  const [selectedChannelUid, setSelectedChannelUid] = useState<string>("");
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [fileUploadPending, setFileUploadPending] = useState<Record<string, boolean>>({});

  const { mutate: submitQuestion, isPending: isCreatePending } = useCreateQuestion();
  const [isValidating, setIsValidating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const { draft, updateDraft, resetDraft } = useQuestionDraft();
  const [ttlHours, setTtlHours] = useState<number | null>(null);

  const { data: chambersData } = useListChambers();
  const chambers = chambersData || [];
  const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);
  const selectedChamberData = JOINED_CHAMBERS.find((c) => c.uid === selectedChamber);

  const { data: channelsData = [] } = useListChannels(selectedChamber);
  const selectedChannelData = channelsData.find((c: any) => c.uid === selectedChannelUid) || channelsData[0];

  // Set default values when opening modal
  useEffect(() => {
    if (isOpen) {
      const chamberToSelect = defaultChamberId || activeChamberId;
      const channelToSelect = defaultChannelId || activeChannelId;
      if (chamberToSelect) {
        setSelectedChamber(chamberToSelect);
      }
      if (channelToSelect) {
        setSelectedChannelUid(channelToSelect);
      }
    }
  }, [isOpen, defaultChamberId, defaultChannelId, activeChamberId, activeChannelId]);

  // Set default channel when channels list loads
  useEffect(() => {
    if (channelsData.length > 0) {
      const hasSelected = channelsData.some((c: any) => c.uid === selectedChannelUid);
      if (!hasSelected) {
        const discChan = channelsData.find((c: any) => c.name === "discussion");
        setSelectedChannelUid(discChan ? discChan.uid : channelsData[0].uid);
      }
    }
  }, [channelsData, selectedChannelUid]);

  // Reset custom fields when channel changes
  useEffect(() => {
    setCustomFields({});
  }, [selectedChannelUid]);

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

      // Validate required elements in dynamic schema
      const activeChannel = channelsData.find((c: any) => c.uid === selectedChannelUid) || channelsData[0];
      if (activeChannel && activeChannel.schema) {
        for (const field of activeChannel.schema) {
          const val = customFields[field.id];
          const isEmpty = val === undefined || val === null || val === "";
          if (field.required && field.disabled !== true && isEmpty) {
            toast.error(`"${field.label}" is required`);
            setIsValidating(false);
            return;
          }
        }
      }

      const payload = {
        content: fullContent,
        chamberUid: selectedChamber,
        channelUid: selectedChannelUid || (activeChannel?.uid || undefined),
        customFields: customFields,
        postType: "qna" as const,
        ttlHours,
      };

      submitQuestion(payload, {
        onSuccess: () => {
          resetDraft();
          setImages([]);
          setSelectedChamber("");
          setSelectedChannelUid("");
          setCustomFields({});
          setTtlHours(null);
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

        <div className="px-5 pb-5 space-y-4 max-h-[80vh] overflow-y-auto pr-3">
          <div className="flex items-start gap-3">
            <UserAvatar
              src={user.avatar}
              name={user.username}
              className="size-9 mt-0.5 shrink-0"
            />
            <div className="flex-1 space-y-3">
              <div className="bg-transparent space-y-3">
                <MentionField
                  placeholder="What's on your mind?"
                  ariaLabel="Post content"
                  className="resize-none min-h-[90px] border-none shadow-none focus-visible:ring-0 bg-transparent p-0 text-sm focus:outline-none rounded-none"
                  value={draft.content}
                  onValueChange={(value) => updateDraft({ content: value })}
                  multiline
                />

                {/* Image previews */}
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

                {/* Dynamic custom fields form engine */}
                {selectedChannelData && selectedChannelData.schema && selectedChannelData.schema.length > 0 && (
                  <div className="space-y-3 py-3 border-t border-neutral-100 dark:border-neutral-900 mt-2 bg-neutral-50/30 dark:bg-neutral-950/20 p-3 rounded-2xl">
                    <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                      Details for #{selectedChannelData.name}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedChannelData.schema.filter((field: any) => field.disabled !== true).map((field: any) => {
                        const val = customFields[field.id] || "";
                        const setVal = (value: any) => setCustomFields((prev) => ({ ...prev, [field.id]: value }));

                        if (field.type === "select") {
                          return (
                            <div key={field.id} className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="inline-flex items-center justify-between rounded-xl h-9 px-3 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 transition-colors focus:outline-none cursor-pointer">
                                  <span>{val || "Select..."}</span>
                                  <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-neutral-400" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[160px]">
                                  {field.options?.map((opt: string) => (
                                    <DropdownMenuItem key={opt} onClick={() => setVal(opt)} className="cursor-pointer text-xs">
                                      {opt}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          );
                        }

                        if (field.type === "number") {
                          return (
                            <div key={field.id} className="flex flex-col gap-1 col-span-1">
                              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </span>
                              <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50/20 dark:bg-neutral-900/10 h-9">
                                <button
                                  type="button"
                                  onClick={() => setVal(Math.max(0, Number(val) - 1))}
                                  className="w-8 h-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-semibold cursor-pointer select-none"
                                >
                                  −
                                </button>
                                <span className="flex-1 text-center text-xs font-bold text-neutral-800 dark:text-neutral-200 select-none">
                                  {val || 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setVal(Number(val) + 1)}
                                  className="w-8 h-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-semibold cursor-pointer select-none"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        }

                        if (field.type === "currency") {
                          return (
                            <div key={field.id} className="flex flex-col gap-1 col-span-1">
                              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </span>
                              <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50/20 dark:bg-neutral-900/10 h-9 px-3">
                                <span className="text-xs text-neutral-400 font-bold mr-1">₹</span>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={val}
                                  onChange={(e) => setVal(e.target.value)}
                                  className="w-full bg-transparent border-none text-xs text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </div>
                          );
                        }

                        if (field.type === "datetime") {
                          return (
                            <div key={field.id} className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </span>
                              <DateTimePicker value={val} onChange={setVal} placeholder="Pick date & time" />
                            </div>
                          );
                        }

                        if (field.type === "file") {
                          const fileVal = val as { url: string; name: string; size: number; type: string } | undefined;
                          const isUploading = !!fileUploadPending[field.id];

                          const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setFileUploadPending((prev) => ({ ...prev, [field.id]: true }));
                            try {
                              const publicUrl = await uploadImagePresigned(file);
                              setVal({
                                url: publicUrl,
                                name: file.name,
                                size: file.size,
                                type: file.type,
                              });
                              toast.success("File uploaded successfully!");
                            } catch (err) {
                              toast.error("Failed to upload file");
                            } finally {
                              setFileUploadPending((prev) => ({ ...prev, [field.id]: false }));
                            }
                          };

                          return (
                            <div key={field.id} className="flex flex-col gap-1 col-span-2">
                              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </span>
                              {fileVal ? (
                                <div className="flex items-center justify-between p-3.5 border border-neutral-250 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10 rounded-2xl text-xs font-semibold">
                                  <div className="flex items-center gap-2.5 truncate max-w-[80%] text-neutral-800 dark:text-neutral-200">
                                    <span className="text-lg">📁</span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold truncate">{fileVal.name}</span>
                                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                                        {(fileVal.size / (1024 * 1024)).toFixed(2)} MB
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setVal(undefined)}
                                    className="text-xs text-[var(--brand)] hover:text-[var(--brand-hover)] cursor-pointer font-bold select-none border-none bg-transparent"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <div className="relative w-full h-24 border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-neutral-50/20 dark:bg-neutral-900/5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all">
                                  <input
                                    type="file"
                                    onChange={onFileChange}
                                    disabled={isUploading}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  />
                                  {isUploading ? (
                                    <>
                                      <span className="inline-block size-5 rounded-full border-2 border-neutral-300 border-t-[var(--brand)] animate-spin" />
                                      <span className="text-[11px] text-neutral-500">Uploading attachment...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-lg text-neutral-400">📄</span>
                                      <span className="text-xs text-neutral-500 font-medium">
                                        Click or Drag to Upload File (Max 12MB)
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div key={field.id} className={cn("flex flex-col gap-1", field.type === "url" ? "col-span-2" : "col-span-2 sm:col-span-1")}>
                            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </span>
                            <input
                              type={field.type === "url" ? "url" : "text"}
                              placeholder={field.type === "url" ? "https://..." : `Enter ${field.label.toLowerCase()}`}
                              value={val}
                              onChange={(e) => setVal(e.target.value)}
                              className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/20 dark:bg-neutral-900/10 text-xs text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 flex-wrap pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Chamber Selector */}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-1.5 h-8 px-2.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer border border-neutral-200 dark:border-neutral-700 max-w-[180px] truncate">
                        {selectedChamberData ? (
                          <>
                            <div className={cn("size-2 rounded-full", CHAMBER_COLORS[(selectedChamberData.colorIndex || 0) % CHAMBER_COLORS.length])} />
                            <span className="truncate">{selectedChamberData.name}</span>
                          </>
                        ) : (
                          <>
                            <Layers className="size-3 text-neutral-500" />
                            Chamber
                          </>
                        )}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 max-h-[200px] overflow-y-auto scrollbar-thin">
                        {JOINED_CHAMBERS.length > 0 ? JOINED_CHAMBERS.map((chamber, i) => (
                          <DropdownMenuItem key={chamber.uid || i} onClick={() => setSelectedChamber(chamber.uid!)} className="gap-2 cursor-pointer text-xs">
                            <div className={cn("size-2.5 rounded-full", CHAMBER_COLORS[(chamber.colorIndex || 0) % CHAMBER_COLORS.length])} />
                            {chamber.name}
                          </DropdownMenuItem>
                        )) : (
                          <div className="px-2 py-1.5 text-xs text-neutral-500">No chambers joined</div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Channel Selector */}
                    {selectedChamber && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-1.5 h-8 px-2.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer border border-neutral-200 dark:border-neutral-700 max-w-[180px] truncate">
                          <Hash className="size-3 text-neutral-500 shrink-0" />
                          <span className="truncate">#{selectedChannelData?.name || "Channel"}</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 max-h-[200px] overflow-y-auto scrollbar-thin">
                          {channelsData.length > 0 ? channelsData.map((ch: any) => (
                            <DropdownMenuItem key={ch.uid} onClick={() => setSelectedChannelUid(ch.uid)} className="cursor-pointer text-xs">
                              #{ch.name}
                            </DropdownMenuItem>
                          )) : (
                            <div className="px-2 py-1.5 text-xs text-neutral-500">No channels found</div>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Image Upload Button */}
                    <button
                      type="button"
                      disabled={imageUploading || images.length >= 4}
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer transition-colors disabled:opacity-50"
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
                    {/* Auto-expire (TTL) Button */}
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
                      <HugeiconsIcon icon={HourglassIcon} className="size-3.5" />
                      {ttlHours !== null ? `${ttlHours}h` : "Timer"}
                    </button>

                    <Button
                      size="sm"
                      className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white rounded-lg text-xs h-8 px-4 border-none font-semibold cursor-pointer shrink-0"
                      onClick={handleSubmit}
                      disabled={!selectedChamber || !draft.content.trim() || isValidating || isCreatePending || Object.values(fileUploadPending).some(Boolean)}
                    >
                      {isCreatePending ? "Posting..." : "Post"}
                      <HugeiconsIcon icon={Edit01Icon} className="ml-1.5 size-3.5" />
                    </Button>
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
