import { useState, useEffect } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { useUpdateQuestion } from "@/hooks/use-questions";
import { useEditPostModal } from "@/hooks/use-edit-post-modal";
import { validateMentions } from "@/lib/mention-validation";
import { handleApiError } from "@/lib/api-error";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionField } from "@/components/ui/mention-field";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { uploadImagePresigned } from "@/api/upload";
import {
  File as FileIcon,
  IndianRupee,
  Calendar,
  MapPin,
  Route,
  Tag,
  MessageSquare,
  FileUp,
  Image as ImageIcon,
} from "lucide-react";
import type { SchemaField } from "@/types";

const MAX_POST_WORDS = 5000;
const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

const FIELD_TYPES = [
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "poll", label: "Poll", icon: ImageIcon },
  { value: "currency", label: "Price", icon: IndianRupee },
  { value: "datetime", label: "Date-Time", icon: Calendar },
  { value: "file", label: "File", icon: FileUp },
  { value: "location", label: "Location", icon: MapPin },
  { value: "source_destination", label: "Source → Destination", icon: Route },
  { value: "key_value", label: "Key:Value", icon: Tag },
  { value: "button", label: "DM Button", icon: MessageSquare },
] as const;

export function EditPostDialog() {
  const { isOpen, close, editingQuestion } = useEditPostModal();
  const { data: user } = useAuth();
  const isMobile = useIsMobile();
  const hasToken = !!user;

  const { mutate: updateQuestion, isPending: isUpdatePending } = useUpdateQuestion();
  const [isValidating, setIsValidating] = useState(false);
  const [content, setContent] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [activeFields, setActiveFields] = useState<SchemaField[]>([]);
  const [fileUploadPending, setFileUploadPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen || !editingQuestion) return;

    setContent(editingQuestion.content || "");

    const existingCustomFields = editingQuestion.customFields || {};
    const fieldTypesMeta: Record<string, string> = existingCustomFields._fieldTypes || {};
    const fieldLabelsMeta: Record<string, string> = existingCustomFields._fieldLabels || {};
    const fieldOptionsMeta: Record<string, string[]> = existingCustomFields._fieldOptions || {};

    const fields: SchemaField[] = Object.entries(fieldTypesMeta).map(([id, type]) => ({
      id,
      type: type as SchemaField["type"],
      label: fieldLabelsMeta[id] || id,
      required: false,
      options: fieldOptionsMeta[id],
    }));
    setActiveFields(fields);

    const values: Record<string, any> = {};
    for (const [key, value] of Object.entries(existingCustomFields)) {
      if (!key.startsWith("_")) {
        values[key] = value;
      }
    }
    setCustomFields(values);
    setFileUploadPending({});
  }, [isOpen, editingQuestion]);

  const handleSubmit = async () => {
    if (!editingQuestion?.uid || !content.trim() || isUpdatePending || isValidating) return;

    setIsValidating(true);
    try {
      const result = await validateMentions(content);
      if (result.missing.length > 0) {
        toastManager.add({ title: `User not found: ${result.missing.join(", ")}`, type: "error" });
        setIsValidating(false);
        return;
      }

      if (countWords(content) > MAX_POST_WORDS) {
        toastManager.add({ title: `Post exceeds ${MAX_POST_WORDS} word limit`, type: "error" });
        setIsValidating(false);
        return;
      }

      const finalCustomFields: Record<string, any> = { ...customFields };
      const _fieldTypes: Record<string, string> = {};
      const _fieldLabels: Record<string, string> = {};
      const _fieldOptions: Record<string, string[]> = {};

      for (const field of activeFields) {
        const val = customFields[field.id];
        if (val !== undefined && val !== null && val !== "") {
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

      updateQuestion(
        {
          questionId: editingQuestion.uid,
          content,
          customFields: finalCustomFields,
        },
        {
          onSuccess: () => {
            toastManager.add({ title: "Post updated!", type: "success" });
            close();
          },
          onError: (err) => {
            handleApiError(err, "Failed to update post");
          },
          onSettled: () => setIsValidating(false),
        },
      );
    } catch {
      toastManager.add({ title: "Failed to validate mentions", type: "error" });
      setIsValidating(false);
    }
  };

  if (!hasToken || !user) return null;

  const setVal = (fieldId: string, v: any) =>
    setCustomFields((p) => ({ ...p, [fieldId]: v }));

  const val = (fieldId: string) =>
    customFields[fieldId] ?? "";

  const renderFormContent = () => (
    <div className="flex flex-col sm:flex-row items-start gap-3">
      <UserAvatar
        src={user.avatar}
        name={user.username}
        className="size-9 mt-0.5 shrink-0"
      />
      <div className="flex-1 w-full space-y-3">
        <div className="bg-transparent">
          <MentionField
            placeholder="Edit your post..."
            ariaLabel="Edit post content"
            className="resize-none min-h-[120px] border-none shadow-none focus-visible:ring-2 focus-visible:ring-neutral-200 dark:focus-visible:ring-neutral-700 bg-transparent px-4 py-3 text-sm focus:outline-none rounded-xl"
            value={content}
            onValueChange={setContent}
            multiline
          />
        </div>

        {/* Existing custom fields (editable, no add new) */}
        {activeFields.length > 0 && (
          <div className="space-y-4 pt-3 border-t border-neutral-100 dark:border-neutral-900/60">
            <div className="bg-neutral-50/30 dark:bg-neutral-950/25 p-3.5 rounded-2xl space-y-3.5">
              <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Post Details
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                {activeFields.map((field) => {
                  const fieldVal = val(field.id) ||
                    (field.type === "poll"
                      ? { question: "", options: ["", ""] }
                      : field.type === "source_destination"
                        ? { source: "", destination: "" }
                        : field.type === "key_value"
                          ? { key: "", value: "" }
                          : field.type === "button"
                            ? { label: "", template: "" }
                            : "");
                  const setFieldVal = (v: any) => setVal(field.id, v);
                  const ft = FIELD_TYPES.find((f) => f.value === field.type);
                  const Icon = ft?.icon || FileIcon;

                  return (
                    <div
                      key={field.id}
                      className={cn(
                        "p-3 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/50 space-y-2.5 shadow-sm",
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
                      <div className="flex items-center justify-between gap-2 pl-0.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Icon className="size-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                          <span className="text-xs font-bold text-neutral-850 dark:text-neutral-100 truncate">
                            {field.label}
                          </span>
                        </div>
                      </div>

                      {field.type === "currency" && (
                        <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50/20 dark:bg-neutral-900/10 h-9 px-3">
                          <span className="text-xs text-neutral-400 font-bold mr-1">₹</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={fieldVal}
                            onChange={(e) => setFieldVal(e.target.value)}
                            className="w-full bg-transparent border-none text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      )}

                      {field.type === "datetime" && (
                        <DateTimePicker
                          value={fieldVal}
                          onChange={setFieldVal}
                          placeholder="Pick date & time"
                        />
                      )}

                      {field.type === "location" && (
                        <input
                          type="text"
                          placeholder="Location..."
                          value={fieldVal}
                          onChange={(e) => setFieldVal(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                        />
                      )}

                      {field.type === "source_destination" && (() => {
                        const routeVal = (fieldVal as { source: string; destination: string } | undefined) || { source: "", destination: "" };
                        const setRoute = (update: { source?: string; destination?: string }) => setFieldVal({ ...routeVal, ...update });
                        return (
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <input
                              type="text"
                              placeholder="From..."
                              value={routeVal.source}
                              onChange={(e) => setRoute({ source: e.target.value })}
                              className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                            />
                            <input
                              type="text"
                              placeholder="To..."
                              value={routeVal.destination}
                              onChange={(e) => setRoute({ destination: e.target.value })}
                              className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                            />
                          </div>
                        );
                      })()}

                      {field.type === "key_value" && (() => {
                        const kvVal = (fieldVal as { key: string; value: string } | undefined) || { key: "", value: "" };
                        const setKv = (update: { key?: string; value?: string }) => setFieldVal({ ...kvVal, ...update });
                        return (
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <input
                              type="text"
                              placeholder="Property..."
                              value={kvVal.key}
                              onChange={(e) => setKv({ key: e.target.value })}
                              className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                            />
                            <input
                              type="text"
                              placeholder="Value..."
                              value={kvVal.value}
                              onChange={(e) => setKv({ value: e.target.value })}
                              className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                            />
                          </div>
                        );
                      })()}

                      {field.type === "button" && (() => {
                        const btnVal = (fieldVal as { label: string; template: string } | undefined) || { label: "", template: "" };
                        const setBtn = (update: { label?: string; template?: string }) => setFieldVal({ ...btnVal, ...update });
                        return (
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <input
                              type="text"
                              placeholder="Label..."
                              value={btnVal.label}
                              onChange={(e) => setBtn({ label: e.target.value })}
                              className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                            />
                            <input
                              type="text"
                              placeholder="Template..."
                              value={btnVal.template}
                              onChange={(e) => setBtn({ template: e.target.value })}
                              className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs text-neutral-850 dark:text-neutral-200 placeholder:text-neutral-455 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                            />
                          </div>
                        );
                      })()}

                      {field.type === "file" && (() => {
                        const fileVal = fieldVal as { url: string; name: string; size: number; type: string } | undefined;
                        const isUploading = !!fileUploadPending[field.id];
                        const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setFileUploadPending((p) => ({ ...p, [field.id]: true }));
                          try {
                            const publicUrl = await uploadImagePresigned(file);
                            setFieldVal({ url: publicUrl, name: file.name, size: file.size, type: file.type });
                            toastManager.add({ title: "File uploaded!", type: "success" });
                          } catch {
                            toastManager.add({ title: "Failed to upload", type: "error" });
                          } finally {
                            setFileUploadPending((p) => ({ ...p, [field.id]: false }));
                          }
                        };
                        return (
                          <div className="w-full">
                            {fileVal ? (
                              <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10 rounded-2xl text-xs font-semibold">
                                <div className="flex items-center gap-2.5 truncate max-w-[80%] text-neutral-800 dark:text-neutral-200">
                                  <FileIcon className="size-4 text-neutral-450 dark:text-neutral-400 shrink-0" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold truncate">{fileVal.name}</span>
                                    <span className="text-[10px] text-neutral-450 dark:text-neutral-500 font-medium">
                                      {(fileVal.size / (1024 * 1024)).toFixed(2)} MB
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setFieldVal(undefined)}
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
                                    <span className="text-[11px] text-neutral-500">Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <FileUp className="size-5 text-neutral-400 shrink-0" />
                                    <span className="text-xs text-neutral-500 font-medium">
                                      Upload replacement file (max 12MB)
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {field.type === "image" && (() => {
                        const imgVal = fieldVal as { url: string; name: string; size: number } | undefined;
                        const isUploading = !!fileUploadPending[field.id];
                        const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.type.startsWith("image/")) {
                            toastManager.add({ title: "Please upload an image file", type: "error" });
                            return;
                          }
                          setFileUploadPending((p) => ({ ...p, [field.id]: true }));
                          try {
                            const publicUrl = await uploadImagePresigned(file);
                            setFieldVal({ url: publicUrl, name: file.name, size: file.size });
                            toastManager.add({ title: "Image uploaded!", type: "success" });
                          } catch {
                            toastManager.add({ title: "Failed to upload image", type: "error" });
                          } finally {
                            setFileUploadPending((p) => ({ ...p, [field.id]: false }));
                          }
                        };
                        return (
                          <div className="w-full">
                            {imgVal?.url ? (
                              <div className="relative group size-20 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-100 dark:bg-neutral-900">
                                <img src={imgVal.url} alt={field.label} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => setFieldVal(undefined)}
                                    className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-colors shadow"
                                  >
                                    <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
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
                                    <span className="text-[11px] text-neutral-500">Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="size-5 text-neutral-400 shrink-0" />
                                    <span className="text-xs text-neutral-550 font-medium">
                                      Upload replacement image
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {field.type === "poll" && (() => {
                        const pollVal = (fieldVal as { question: string; options: string[] } | undefined) || {
                          question: "",
                          options: ["", ""],
                        };
                        const setPoll = (update: { question?: string; options?: string[] }) => setFieldVal({ ...pollVal, ...update });
                        return (
                          <div className="space-y-2 w-full">
                            <input
                              type="text"
                              placeholder="Ask a question..."
                              value={pollVal.question}
                              onChange={(e) => setPoll({ question: e.target.value })}
                              className="w-full h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/10 dark:bg-neutral-900/25 text-xs font-semibold text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-450 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/35"
                            />
                            <div className="space-y-1.5">
                              {pollVal.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
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
                                        setPoll({ options: pollVal.options.filter((_, j) => j !== i) })
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
                                onClick={() => setPoll({ options: [...pollVal.options, ""] })}
                                className="flex items-center gap-1 text-[11px] font-bold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors cursor-pointer select-none"
                              >
                                <span className="text-sm leading-none">+</span> Add option
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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
              Edit Post
            </DrawerTitle>
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmit}
              disabled={
                !content.trim() ||
                isValidating ||
                isUpdatePending ||
                Object.values(fileUploadPending).some(Boolean)
              }
            >
              {isUpdatePending ? "Saving..." : "Save"}
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
            Edit Post
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
              !content.trim() ||
              isValidating ||
              isUpdatePending ||
              Object.values(fileUploadPending).some(Boolean)
            }
          >
            {isUpdatePending ? "Saving..." : "Save Changes"}
            <HugeiconsIcon icon={Edit01Icon} className="ml-1.5 size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
