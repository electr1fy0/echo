import { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerPopup,
  DrawerPanel,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DialogFooter } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth, useToken } from "@/hooks/use-auth";
import { useCreateQuestion, useQuestionDraft } from "@/hooks/use-questions";
import { useListChambers, useListChannels } from "@/hooks/use-chamber";
import { validateMentions } from "@/lib/mention-validation";
import { toast } from "sonner";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn } from "@/lib/utils";

const MAX_POST_WORDS = 5000;
const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionField } from "@/components/ui/mention-field";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Button } from "@/components/ui/button";
import { useCreatePostModal } from "@/hooks/use-create-post-modal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Image01Icon,
  Delete02Icon,
  HourglassIcon,
} from "@hugeicons/core-free-icons";
import { uploadImagePresigned } from "@/api/upload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import {
  Hash,
  Layers,
  IndianRupee,
  Calendar,
  FileUp,
  Image as ImageIcon,
  BarChart3,
  File as FileIcon,
  MapPin,
  Route,
  Tag,
  MessageSquare,
} from "lucide-react";
import type { SchemaField } from "@/types";

const FIELD_TYPES = [
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "poll", label: "Poll", icon: BarChart3 },
  { value: "currency", label: "Price", icon: IndianRupee },
  { value: "datetime", label: "Date-Time", icon: Calendar },
  { type: "file" as const, value: "file", label: "File", icon: FileUp },
  { value: "location", label: "Location", icon: MapPin },
  { value: "source_destination", label: "Source → Destination", icon: Route },
  { value: "key_value", label: "Key:Value", icon: Tag },
  { value: "button", label: "DM Button", icon: MessageSquare },
] as const;

export function CreatePostDialog() {
  const {
    isOpen,
    close,
    defaultChamberId,
    defaultChannelId,
    activeChamberId,
    activeChannelId,
  } = useCreatePostModal();
  const { data: user } = useAuth();
  const token = useToken();
  const isMobile = useIsMobile();
  const hasToken = !!token;
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedChamber, setSelectedChamber] = useState<string>("");
  const [selectedChannelUid, setSelectedChannelUid] = useState<string>("");
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [fileUploadPending, setFileUploadPending] = useState<
    Record<string, boolean>
  >({});
  const [activeFields, setActiveFields] = useState<
    (SchemaField & { isUserAdded?: boolean })[]
  >([]);

  const { mutate: submitQuestion, isPending: isCreatePending } =
    useCreateQuestion();
  const [isValidating, setIsValidating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const { draft, updateDraft, resetDraft } = useQuestionDraft();
  const [ttlHours, setTtlHours] = useState<number | null>(null);

  const { data: chambersData } = useListChambers();
  const chambers = chambersData || [];
  const JOINED_CHAMBERS = chambers.filter((c) => c.isJoined);
  const selectedChamberData = JOINED_CHAMBERS.find(
    (c) => c.uid === selectedChamber,
  );

  const { data: channelsData = [] } = useListChannels(selectedChamber);
  const selectedChannelData =
    channelsData.find((c: any) => c.uid === selectedChannelUid) ||
    channelsData[0];

  useEffect(() => {
    if (!isOpen) {
      resetDraft();
      setImages([]);
      setSelectedChamber("");
      setSelectedChannelUid("");
      setCustomFields({});
      setActiveFields([]);
      setTtlHours(null);
      return;
    }
    const chamberToSelect = defaultChamberId || activeChamberId;
    const channelToSelect = defaultChannelId || activeChannelId;
    if (chamberToSelect) setSelectedChamber(chamberToSelect);
    if (channelToSelect) setSelectedChannelUid(channelToSelect);
  }, [
    isOpen,
    defaultChamberId,
    defaultChannelId,
    activeChamberId,
    activeChannelId,
  ]);

  useEffect(() => {
    if (channelsData.length > 0) {
      const hasSelected = channelsData.some(
        (c: any) => c.uid === selectedChannelUid,
      );
      if (!hasSelected) {
        const discChan = channelsData.find((c: any) => c.name === "discussion");
        setSelectedChannelUid(discChan ? discChan.uid : channelsData[0].uid);
      }
    }
  }, [channelsData, selectedChannelUid]);

  useEffect(() => {
    setCustomFields({});
    if (selectedChannelData) {
      const schemaFields = (selectedChannelData.schema || []).filter(
        (f: any) =>
          f.disabled !== true &&
          [
            "image",
            "poll",
            "currency",
            "datetime",
            "file",
            "location",
            "source_destination",
            "key_value",
            "button",
          ].includes(f.type),
      );
      setActiveFields(schemaFields);
    } else {
      setActiveFields([]);
    }
  }, [selectedChannelUid, selectedChannelData]);

  const handleUploadImages = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 4 - images.length;
    if (remaining <= 0) {
      toast.error("Max 4 images per post");
      return;
    }
    setImageUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      try {
        urls.push(await uploadImagePresigned(file));
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setImages((prev) => [...prev, ...urls]);
    setImageUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const addFieldType = (type: SchemaField["type"]) => {
    const defaultLabels: Record<string, string> = {
      text: "Text Field",
      number: "Count",
      currency: "Price",
      select: "Options",
      datetime: "Date-Time",
      url: "Link",
      file: "File",
      image: "Image Photo",
      poll: "Poll",
      location: "Location",
      source_destination: "Source → Destination",
      key_value: "Key:Value",
      button: "DM Button",
    };

    const id = `user_${type}_${Date.now()}`;
    const newField: SchemaField & { isUserAdded?: boolean } = {
      id,
      type,
      label: defaultLabels[type] || "Field",
      required: false,
      isUserAdded: true,
    };

    setActiveFields((prev) => [...prev, newField]);

    // Set default value in customFields
    if (type === "poll") {
      setCustomFields((p) => ({
        ...p,
        [id]: { question: "", options: ["", ""] },
      }));
    } else if (type === "source_destination") {
      setCustomFields((p) => ({ ...p, [id]: { source: "", destination: "" } }));
    } else if (type === "key_value") {
      setCustomFields((p) => ({ ...p, [id]: { key: "", value: "" } }));
    } else if (type === "button") {
      setCustomFields((p) => ({ ...p, [id]: { label: "", template: "" } }));
    } else {
      setCustomFields((p) => ({ ...p, [id]: "" }));
    }
  };

  const removeField = (id: string) => {
    setActiveFields((prev) => prev.filter((f) => f.id !== id));
    setCustomFields((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (
      !selectedChamber ||
      !draft.content.trim() ||
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

      if (countWords(draft.content) > MAX_POST_WORDS) {
        toast.error(`Post exceeds ${MAX_POST_WORDS} word limit`);
        setIsValidating(false);
        return;
      }

      // Validate required fields in channel schema
      for (const field of activeFields) {
        if (field.disabled) continue;
        const val = customFields[field.id];
        if (field.type === "poll") {
          const pollVal = val as
            | { question: string; options: string[] }
            | undefined;
          if (
            field.required &&
            (!pollVal?.question?.trim() ||
              pollVal.options.filter((o) => o.trim()).length < 2)
          ) {
            toast.error(
              `"${field.label}" requires a question and at least 2 options`,
            );
            setIsValidating(false);
            return;
          }
        } else {
          const isEmpty = val === undefined || val === null || val === "";
          if (field.required && isEmpty) {
            toast.error(`"${field.label}" is required`);
            setIsValidating(false);
            return;
          }
        }
      }

      // Compile custom fields and store type/label/options metadata
      const finalCustomFields: Record<string, any> = {};
      const _fieldTypes: Record<string, string> = {};
      const _fieldLabels: Record<string, string> = {};
      const _fieldOptions: Record<string, string[]> = {};

      for (const field of activeFields) {
        const val = customFields[field.id];
        if (val !== undefined && val !== null && val !== "") {
          finalCustomFields[field.id] = val;
          _fieldTypes[field.id] = field.type;
          _fieldLabels[field.id] = field.label;
          if (field.options) {
            _fieldOptions[field.id] = field.options;
          }
        }
      }

      if (Object.keys(_fieldTypes).length > 0) {
        finalCustomFields._fieldTypes = _fieldTypes;
        finalCustomFields._fieldLabels = _fieldLabels;
        finalCustomFields._fieldOptions = _fieldOptions;
      }

      // Detect if any poll field was filled → post as poll type
      let postType: "qna" | "poll" = "qna";
      let pollQuestion = "";
      let pollOptions: string[] = [];
      for (const [k, v] of Object.entries(finalCustomFields)) {
        if (k.startsWith("_")) continue;
        if (v && typeof v === "object" && "question" in v && "options" in v) {
          const pv = v as { question: string; options: string[] };
          if (pv.question.trim()) {
            postType = "poll";
            pollQuestion = pv.question.trim();
            pollOptions = pv.options.filter((o) => o.trim());
            break;
          }
        }
      }

      const activeChannel =
        channelsData.find((c: any) => c.uid === selectedChannelUid) ||
        channelsData[0];
      const fullContent =
        draft.content + (images.length > 0 ? "\n" + images.join("\n") : "");

      const payload: any = {
        content: postType === "poll" ? pollQuestion : fullContent,
        chamberUid: selectedChamber,
        channelUid: selectedChannelUid || activeChannel?.uid || undefined,
        customFields: finalCustomFields,
        postType,
        ...(ttlHours != null ? { ttlHours } : {}),
      };

      if (postType === "poll") {
        payload.pollQuestion = pollQuestion;
        payload.pollOptions = pollOptions;
      }

      submitQuestion(payload, {
        onSuccess: () => {
          resetDraft();
          setImages([]);
          setSelectedChamber("");
          setSelectedChannelUid("");
          setCustomFields({});
          setActiveFields([]);
          setTtlHours(null);
          toast.success("Posted successfully!");
          close();
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create post");
        },
        onSettled: () => setIsValidating(false),
      });
    } catch {
      toast.error("Failed to validate mentions");
      setIsValidating(false);
    }
  };

  if (!hasToken || !user) return null;

  // Compute restricted types from channel schema
  const restrictedTypes = new Set(
    selectedChannelData?.schema
      ?.filter((f: any) => f.disabled === true)
      ?.map((f: any) => f.type) || [],
  );

  const renderFormContent = () => (
    <div className="flex flex-col sm:flex-row items-start gap-3">
      <UserAvatar
        src={user.avatar}
        name={user.username}
        className="size-9 mt-0.5 shrink-0"
      />
      <div className="flex-1 w-full space-y-3">
        <div className="bg-transparent space-y-3">
          <MentionField
            placeholder="What's on your mind?"
            ariaLabel="Post content"
            className="resize-none min-h-[160px] border-none shadow-none focus-visible:ring-2 focus-visible:ring-neutral-200 dark:focus-visible:ring-neutral-700 bg-transparent px-4 py-3 text-sm focus:outline-none rounded-xl"
            value={draft.content}
            onValueChange={(value) => updateDraft({ content: value })}
            multiline
          />

          {images.length > 0 && (
            <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none bg-transparent">
              {images.map((url, i) => (
                <div
                  key={i}
                  className="relative shrink-0 group transition-transform hover:scale-105"
                >
                  <img
                    src={url}
                    alt=""
                    className="size-12 rounded-xl object-cover shadow-sm border border-neutral-200/50 dark:border-neutral-700/50"
                  />
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
          <div className="space-y-4 pt-3 border-t border-neutral-100 dark:border-neutral-900/60 mt-2">
            {/* Field Selector UI */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {FIELD_TYPES.map((ft) => {
                  const Icon = ft.icon;
                  const isRestricted = restrictedTypes.has(ft.value);
                  if (isRestricted) return null;

                  return (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => addFieldType(ft.value)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-250 dark:border-neutral-800/80 bg-neutral-50/20 hover:bg-neutral-100/50 dark:bg-neutral-950/10 dark:hover:bg-neutral-900/40 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer select-none hover:scale-[1.03] active:scale-[0.97]"
                    >
                      <Icon className="size-3.5 text-neutral-450 dark:text-neutral-400" />
                      {ft.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeFields.length > 0 && (
              <div className="bg-neutral-50/30 dark:bg-neutral-950/25 p-3.5 rounded-2xl space-y-3.5">
                <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Post Details
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  {activeFields.map((field) => {
                    const val =
                      customFields[field.id] ||
                      (field.type === "poll"
                        ? { question: "", options: ["", ""] }
                        : field.type === "source_destination"
                          ? { source: "", destination: "" }
                          : field.type === "key_value"
                            ? { key: "", value: "" }
                            : field.type === "button"
                              ? { label: "", template: "" }
                              : "");
                    const setVal = (v: any) =>
                      setCustomFields((p) => ({ ...p, [field.id]: v }));
                    const ft = FIELD_TYPES.find((f) => f.value === field.type);
                    const Icon = ft?.icon || FileIcon;

                    return (
                      <div
                        key={field.id}
                        className={cn(
                          "p-3 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/50 space-y-2.5 relative group/field shadow-sm",
                          field.type === "file" ||
                            field.type === "image" ||
                            field.type === "poll" ||
                            field.type === "source_destination" ||
                            field.type === "key_value" ||
                            field.type === "button"
                            ? "col-span-2"
                            : "col-span-2 sm:col-span-1",
                        )}
                      >
                        {/* Header: Label and Delete button */}
                        <div className="flex items-center justify-between gap-2 pl-0.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Icon className="size-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                            <span className="text-xs font-bold text-neutral-850 dark:text-neutral-100 truncate">
                              {field.label}{" "}
                              {field.required && (
                                <span className="text-red-500">*</span>
                              )}
                            </span>
                          </div>

                          {/* Remove field button */}
                          {(!field.required || field.isUserAdded) && (
                            <button
                              type="button"
                              onClick={() => removeField(field.id)}
                              className="size-5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold leading-none"
                              aria-label="Remove field"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Input renderers */}
                        {field.type === "currency" && (
                          <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50/20 dark:bg-neutral-900/10 h-9 px-3">
                            <span className="text-xs text-neutral-400 font-bold mr-1">
                              ₹
                            </span>
                            <input
                              type="number"
                              placeholder="0"
                              value={val}
                              onChange={(e) => setVal(e.target.value)}
                              className="w-full bg-transparent border-none text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        )}

                        {field.type === "datetime" && (
                          <DateTimePicker
                            value={val}
                            onChange={setVal}
                            placeholder="Pick date & time"
                          />
                        )}

                        {field.type === "file" &&
                          (() => {
                            const fileVal = val as
                              | {
                                  url: string;
                                  name: string;
                                  size: number;
                                  type: string;
                                }
                              | undefined;
                            const isUploading = !!fileUploadPending[field.id];
                            const onFileChange = async (
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setFileUploadPending((p) => ({
                                ...p,
                                [field.id]: true,
                              }));
                              try {
                                const publicUrl =
                                  await uploadImagePresigned(file);
                                setVal({
                                  url: publicUrl,
                                  name: file.name,
                                  size: file.size,
                                  type: file.type,
                                });
                                toast.success("File uploaded!");
                              } catch {
                                toast.error("Failed to upload");
                              } finally {
                                setFileUploadPending((p) => ({
                                  ...p,
                                  [field.id]: false,
                                }));
                              }
                            };
                            return (
                              <div className="w-full">
                                {fileVal ? (
                                  <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10 rounded-2xl text-xs font-semibold">
                                    <div className="flex items-center gap-2.5 truncate max-w-[80%] text-neutral-800 dark:text-neutral-200">
                                      <FileIcon className="size-4 text-neutral-450 dark:text-neutral-400 shrink-0" />
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-semibold truncate">
                                          {fileVal.name}
                                        </span>
                                        <span className="text-[10px] text-neutral-450 dark:text-neutral-500 font-medium">
                                          {(
                                            fileVal.size /
                                            (1024 * 1024)
                                          ).toFixed(2)}{" "}
                                          MB
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setVal(undefined)}
                                      className="text-xs text-[var(--brand)] hover:text-[var(--brand-hover)] cursor-pointer font-bold border-none bg-transparent"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <div className="relative w-full h-24 border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-neutral-50/20 dark:bg-neutral-900/5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all">
                                    <input
                                      type="file"
                                      onChange={onFileChange}
                                      disabled={isUploading}
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    {isUploading ? (
                                      <>
                                        <span className="inline-block size-5 rounded-full border-2 border-neutral-300 border-t-[var(--brand)] animate-spin" />
                                        <span className="text-[11px] text-neutral-500">
                                          Uploading...
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <FileUp className="size-5 text-neutral-400 shrink-0" />
                                        <span className="text-xs text-neutral-500 font-medium">
                                          Click to Upload (max 12MB)
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                        {field.type === "image" &&
                          (() => {
                            const imgVal = val as
                              | { url: string; name: string; size: number }
                              | undefined;
                            const isUploading = !!fileUploadPending[field.id];
                            const onImageChange = async (
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!file.type.startsWith("image/")) {
                                toast.error("Please upload an image file");
                                return;
                              }
                              setFileUploadPending((p) => ({
                                ...p,
                                [field.id]: true,
                              }));
                              try {
                                const publicUrl =
                                  await uploadImagePresigned(file);
                                setVal({
                                  url: publicUrl,
                                  name: file.name,
                                  size: file.size,
                                });
                                toast.success("Image uploaded!");
                              } catch {
                                toast.error("Failed to upload image");
                              } finally {
                                setFileUploadPending((p) => ({
                                  ...p,
                                  [field.id]: false,
                                }));
                              }
                            };
                            return (
                              <div className="w-full">
                                {imgVal?.url ? (
                                  <div className="relative group size-20 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-100 dark:bg-neutral-900">
                                    <img
                                      src={imgVal.url}
                                      alt={field.label}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() => setVal(undefined)}
                                        className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-colors shadow"
                                      >
                                        <HugeiconsIcon
                                          icon={Delete02Icon}
                                          className="size-3.5"
                                        />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative w-full h-24 border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-neutral-50/20 dark:bg-neutral-900/5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={onImageChange}
                                      disabled={isUploading}
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    {isUploading ? (
                                      <>
                                        <span className="inline-block size-5 rounded-full border-2 border-neutral-300 border-t-[var(--brand)] animate-spin" />
                                        <span className="text-[11px] text-neutral-500">
                                          Uploading...
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <ImageIcon className="size-5 text-neutral-400 shrink-0" />
                                        <span className="text-xs text-neutral-550 font-medium">
                                          Click to Upload Image
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                        {field.type === "poll" &&
                          (() => {
                            const pollVal = (val as
                              | { question: string; options: string[] }
                              | undefined) || {
                              question: "",
                              options: ["", ""],
                            };
                            const setPoll = (update: {
                              question?: string;
                              options?: string[];
                            }) => setVal({ ...pollVal, ...update });
                            return (
                              <div className="space-y-2 w-full">
                                <input
                                  type="text"
                                  placeholder="Ask a question..."
                                  value={pollVal.question}
                                  onChange={(e) =>
                                    setPoll({ question: e.target.value })
                                  }
                                  className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs font-semibold text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-450 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                                />
                                <div className="space-y-1.5">
                                  {pollVal.options.map((opt, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="size-4.5 rounded-full border border-neutral-300 dark:border-neutral-600 shrink-0" />
                                      <input
                                        type="text"
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={(e) => {
                                          const next = [...pollVal.options];
                                          next[i] = e.target.value;
                                          setPoll({ options: next });
                                        }}
                                        className="flex-1 h-8 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-[11px] text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none"
                                      />
                                      {pollVal.options.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPoll({
                                              options: pollVal.options.filter(
                                                (_, j) => j !== i,
                                              ),
                                            })
                                          }
                                          className="size-6 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 transition-colors cursor-pointer text-sm font-bold"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {pollVal.options.length < 6 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPoll({
                                        options: [...pollVal.options, ""],
                                      })
                                    }
                                    className="flex items-center gap-1 text-[11px] font-bold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors cursor-pointer select-none"
                                  >
                                    <span className="text-sm leading-none">
                                      +
                                    </span>{" "}
                                    Add option
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                        {field.type === "location" && (
                          <input
                            type="text"
                            placeholder="Location..."
                            value={val}
                            onChange={(e) => setVal(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                          />
                        )}

                        {field.type === "source_destination" &&
                          (() => {
                            const routeVal = (val as
                              | { source: string; destination: string }
                              | undefined) || { source: "", destination: "" };
                            const setRoute = (update: {
                              source?: string;
                              destination?: string;
                            }) => setVal({ ...routeVal, ...update });
                            return (
                              <div className="grid grid-cols-2 gap-2 w-full">
                                <input
                                  type="text"
                                  placeholder="From..."
                                  value={routeVal.source}
                                  onChange={(e) =>
                                    setRoute({ source: e.target.value })
                                  }
                                  className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                                />
                                <input
                                  type="text"
                                  placeholder="To..."
                                  value={routeVal.destination}
                                  onChange={(e) =>
                                    setRoute({ destination: e.target.value })
                                  }
                                  className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                                />
                              </div>
                            );
                          })()}

                        {field.type === "key_value" &&
                          (() => {
                            const kvVal = (val as
                              | { key: string; value: string }
                              | undefined) || { key: "", value: "" };
                            const setKv = (update: {
                              key?: string;
                              value?: string;
                            }) => setVal({ ...kvVal, ...update });
                            return (
                              <div className="grid grid-cols-2 gap-2 w-full">
                                <input
                                  type="text"
                                  placeholder="Property..."
                                  value={kvVal.key}
                                  onChange={(e) =>
                                    setKv({ key: e.target.value })
                                  }
                                  className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                                />
                                <input
                                  type="text"
                                  placeholder="Value..."
                                  value={kvVal.value}
                                  onChange={(e) =>
                                    setKv({ value: e.target.value })
                                  }
                                  className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                                />
                              </div>
                            );
                          })()}

                        {field.type === "button" &&
                          (() => {
                            const btnVal = (val as
                              | { label: string; template: string }
                              | undefined) || { label: "", template: "" };
                            const setBtn = (update: {
                              label?: string;
                              template?: string;
                            }) => setVal({ ...btnVal, ...update });
                            return (
                              <div className="grid grid-cols-2 gap-2 w-full">
                                <input
                                  type="text"
                                  placeholder="Label..."
                                  value={btnVal.label}
                                  onChange={(e) =>
                                    setBtn({ label: e.target.value })
                                  }
                                  className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                                />
                                <input
                                  type="text"
                                  placeholder="Template..."
                                  value={btnVal.template}
                                  onChange={(e) =>
                                    setBtn({ template: e.target.value })
                                  }
                                  className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                                />
                              </div>
                            );
                          })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-1.5 h-8 px-2.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer border border-neutral-200 dark:border-neutral-700 max-w-[180px] truncate">
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
                      <span className="truncate">
                        {selectedChamberData.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Layers className="size-3 text-neutral-500" />
                      Chamber
                    </>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 max-h-[200px] overflow-y-auto scrollbar-thin"
                >
                  {JOINED_CHAMBERS.length > 0 ? (
                    JOINED_CHAMBERS.map((chamber, i) => (
                      <DropdownMenuItem
                        key={chamber.uid || i}
                        onClick={() => setSelectedChamber(chamber.uid!)}
                        className="gap-2 cursor-pointer text-xs"
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

              {selectedChamber && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-1.5 h-8 px-2.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer border border-neutral-200 dark:border-neutral-700 max-w-[180px] truncate">
                    <Hash className="size-3 text-neutral-500 shrink-0" />
                    <span className="truncate">
                      #{selectedChannelData?.name || "Channel"}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-48 max-h-[200px] overflow-y-auto scrollbar-thin"
                  >
                    {channelsData.length > 0 ? (
                      channelsData.map((ch: any) => (
                        <DropdownMenuItem
                          key={ch.uid}
                          onClick={() => setSelectedChannelUid(ch.uid)}
                          className="cursor-pointer text-xs"
                        >
                          #{ch.name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-xs text-neutral-500">
                        No channels
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

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

              <button
                type="button"
                onClick={() => {
                  const opts: (number | null)[] = [null, 1, 2, 6, 24];
                  setTtlHours(opts[(opts.indexOf(ttlHours) + 1) % opts.length]);
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
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(val) => {
          if (!val) close();
        }}
      >
        <DrawerPopup showCloseButton={false} className="max-sm:max-h-[96vh]">
          <DrawerHeader>
            <DrawerTitle>
              Create a Post
            </DrawerTitle>
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmit}
              disabled={
                !selectedChamber ||
                !draft.content.trim() ||
                isValidating ||
                isCreatePending ||
                Object.values(fileUploadPending).some(Boolean)
              }
            >
              {isCreatePending ? "Posting..." : "Post"}
              <HugeiconsIcon icon={Edit01Icon} className="ml-1.5 size-3.5" />
            </Button>
          </DrawerHeader>

          <DrawerPanel scrollFade={false}>
            {renderFormContent()}
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(val) => {
        if (!val) close();
      }}
    >
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            Create a Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-4 pt-1 flex-1 overflow-y-auto min-h-0">
          {renderFormContent()}
        </div>

        <DialogFooter>
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={
              !selectedChamber ||
              !draft.content.trim() ||
              isValidating ||
              isCreatePending ||
              Object.values(fileUploadPending).some(Boolean)
            }
          >
            {isCreatePending ? "Posting..." : "Post"}
            <HugeiconsIcon icon={Edit01Icon} className="ml-1.5 size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
