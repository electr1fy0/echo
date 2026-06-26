import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Link as LinkIcon,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  MapPin,
  IndianRupee,
  Route,
  Tag,
  Download,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { User } from "@/types";

interface PostCustomFieldsProps {
  customFields: Record<string, any> | null | undefined;
  channelSchema?: any[];
  authorUsername?: string;
  user?: User | null;
  isDMPending?: boolean;
  sendInterestDM?: (payload: {
    authorUsername: string;
    templateMessage: string;
  }) => void;
  openAuthModal?: (view?: "signin" | "signup") => void;
}

export function PostCustomFields({
  customFields,
  channelSchema,
  authorUsername,
  user,
  isDMPending,
  sendInterestDM,
  openAuthModal,
}: PostCustomFieldsProps) {
  const [pendingDM, setPendingDM] = useState<{
    authorUsername: string;
    templateMessage: string;
  } | null>(null);

  if (!customFields) return null;

  const entries = Object.entries(customFields).filter(
    ([k]) => !k.startsWith("_"),
  );

  if (entries.length === 0) return null;

  // Helper to resolve field label, type, disabled state, and whether it's an image or file
  const getFieldInfo = (key: string, val: any) => {
    const fieldDef = channelSchema?.find((f: any) => f.id === key);
    const label =
      customFields._fieldLabels?.[key] ||
      fieldDef?.label ||
      key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const type = customFields._fieldTypes?.[key] || fieldDef?.type;
    const isImage =
      type === "image" ||
      (val &&
        typeof val === "object" &&
        "url" in val &&
        (val.type?.startsWith("image/") ||
          ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
            val.name?.split(".").pop()?.toLowerCase() || "",
          )));
    const isFile =
      !isImage &&
      val &&
      typeof val === "object" &&
      "url" in val &&
      "name" in val;
    return {
      label,
      type,
      isImage,
      isFile,
      disabled: fieldDef?.disabled === true,
    };
  };

  const hasMetadata = entries.some(([key, val]) => {
    const info = getFieldInfo(key, val);
    return (
      !info.isImage &&
      !info.isFile &&
      info.type !== "poll" &&
      !key.startsWith("poll")
    );
  });
  const hasImages = entries.some(
    ([key, val]) => getFieldInfo(key, val).isImage,
  );
  const hasFiles = entries.some(([key, val]) => getFieldInfo(key, val).isFile);

  if (!hasMetadata && !hasImages && !hasFiles) return null;

  return (
    <>
    <div className="mt-3.5 p-4 flex flex-col gap-4 bg-linear-to-br from-neutral-50/60 to-neutral-100/30 dark:from-neutral-900/40 dark:to-neutral-950/20 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/60 rounded-2xl w-full shadow-xs">
      {/* Metadata fields list (excluding files/images) */}
      {hasMetadata && (
        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          <div className="flex items-center gap-2.5 flex-wrap">
            {entries.map(([key, val]) => {
              if (val === undefined || val === null || val === "") return null;
              const info = getFieldInfo(key, val);
              if (
                info.isImage ||
                info.isFile ||
                info.type === "poll" ||
                key.startsWith("poll")
              )
                return null;

              // Format currency type (Price)
              if (
                info.type === "currency" ||
                key === "price" ||
                key === "min_order"
              ) {
                const showLabel = !["price", "cost", "rate", "amount"].includes(
                  info.label.toLowerCase().trim(),
                );
                return (
                  <div
                    key={key}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 bg-amber-500/10 dark:bg-amber-500/10 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 transition-all duration-200 shadow-xs cursor-default",
                      info.disabled && "opacity-50 line-through",
                    )}
                  >
                    <IndianRupee className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {showLabel && (
                        <span className="text-amber-600/80 dark:text-amber-400/80 font-medium mr-1">
                          {info.label}:
                        </span>
                      )}
                      {Number(val).toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              }

              // Format date-time type
              if (
                info.type === "datetime" ||
                key === "datetime" ||
                key === "deadline"
              ) {
                let displayDate = val;
                try {
                  displayDate = new Date(val).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });
                } catch {}
                const showLabel = ![
                  "date-time",
                  "datetime",
                  "date",
                  "time",
                  "deadline",
                  "departure time",
                ].includes(info.label.toLowerCase().trim());
                return (
                  <div
                    key={key}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/40 bg-indigo-500/10 dark:bg-indigo-500/10 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/15 transition-all duration-200 shadow-xs cursor-default",
                      info.disabled && "opacity-50 line-through",
                    )}
                  >
                    <Calendar className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>
                      {showLabel && (
                        <span className="text-indigo-600/80 dark:text-indigo-400/80 font-medium mr-1">
                          {info.label}:
                        </span>
                      )}
                      {displayDate}
                    </span>
                  </div>
                );
              }

              // Format location type
              if (info.type === "location" || key === "location") {
                const showLabel = !["location"].includes(
                  info.label.toLowerCase().trim(),
                );
                return (
                  <div
                    key={key}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40 bg-emerald-500/10 dark:bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-all duration-200 shadow-xs cursor-default",
                      info.disabled && "opacity-50 line-through",
                    )}
                  >
                    <MapPin className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {showLabel && (
                        <span className="text-emerald-600/80 dark:text-emerald-400/80 font-medium mr-1">
                          {info.label}:
                        </span>
                      )}
                      {String(val)}
                    </span>
                  </div>
                );
              }

              // Format Route type
              if (info.type === "source_destination" || key === "route") {
                const routeVal = val as
                  | { source: string; destination: string }
                  | undefined;
                if (!routeVal?.source && !routeVal?.destination) return null;
                return (
                  <div
                    key={key}
                    className={cn(
                      "inline-flex items-center gap-2 h-8 px-3 rounded-2xl border border-cyan-200/50 dark:border-cyan-900/40 bg-cyan-500/10 dark:bg-cyan-500/10 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/15 transition-all duration-200 shadow-xs cursor-default",
                      info.disabled && "opacity-50 line-through",
                    )}
                  >
                    <Route className="size-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="truncate">
                      {routeVal.source || "Anywhere"}
                    </span>
                    <svg
                      viewBox="0 0 40 16"
                      className="w-8 h-4 text-cyan-500/60 dark:text-cyan-400/60 shrink-0 mx-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="2" y1="8" x2="38" y2="8" />
                      <polyline points="30 3 37 8 30 13" />
                    </svg>
                    <span className="truncate">
                      {routeVal.destination || "Anywhere"}
                    </span>
                  </div>
                );
              }

              // Format key_value type
              if (
                info.type === "key_value" ||
                (val &&
                  typeof val === "object" &&
                  "key" in val &&
                  "value" in val)
              ) {
                const kvVal = val as { key: string; value: string } | undefined;
                if (!kvVal?.key && !kvVal?.value) return null;
                return (
                  <div
                    key={key}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-500/10 dark:bg-slate-500/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-500/15 transition-all duration-200 shadow-xs cursor-default",
                      info.disabled && "opacity-50 line-through",
                    )}
                  >
                    <Tag className="size-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span>
                      <span className="text-slate-600/80 dark:text-slate-400/80 font-medium mr-1">
                        {kvVal.key || "Property"}:
                      </span>
                      {kvVal.value || "Any"}
                    </span>
                  </div>
                );
              }

              // Format button type
              if (
                info.type === "button" ||
                (val &&
                  typeof val === "object" &&
                  "label" in val &&
                  "template" in val)
              ) {
                const btnVal = val as
                  | { label: string; template: string }
                  | undefined;
                if (!btnVal?.label) return null;

                const isSelf = user?.username === authorUsername;
                return (
                  <Button
                    key={key}
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isSelf || isDMPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        openAuthModal?.("signin");
                        return;
                      }
                      setPendingDM({
                        authorUsername: authorUsername!,
                        templateMessage:
                          btnVal.template ||
                          `Hey, I'm interested in your post!`,
                      });
                    }}
                    className="cursor-pointer text-xs font-semibold rounded-2xl h-8 px-4 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white border-none shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-200 shrink-0"
                  >
                    {btnVal.label}
                  </Button>
                );
              }

              // Format url type
              if (
                info.type === "url" ||
                (typeof val === "string" && val.startsWith("http"))
              ) {
                const showLabel = !["link", "url", "website"].includes(
                  info.label.toLowerCase().trim(),
                );
                return (
                  <a
                    key={key}
                    href={val}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-blue-200/50 dark:border-blue-900/40 bg-blue-500/10 dark:bg-blue-500/10 text-xs text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-500/15 transition-all duration-200 shadow-xs",
                      info.disabled && "opacity-50 line-through",
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LinkIcon className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="hover:underline">
                      {showLabel ? info.label : "Link"}
                    </span>
                  </a>
                );
              }

              // Generic field rendering
              return (
                <div
                  key={key}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-2xl border border-violet-200/50 dark:border-violet-900/40 bg-violet-500/10 dark:bg-violet-500/10 text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-500/15 transition-all duration-200 shadow-xs cursor-default",
                    info.disabled && "opacity-50",
                  )}
                >
                  <FileText className="size-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>
                    <span className="text-violet-600/80 dark:text-violet-400/80 font-medium mr-1">
                      {info.label}:
                    </span>
                    {String(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Images Section */}
      {hasImages && (
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex gap-3 overflow-x-auto scrollbar-none py-1">
            {entries.map(([key, val]) => {
              if (val === undefined || val === null || val === "") return null;

              const info = getFieldInfo(key, val);
              if (!info.isImage) return null;

              const file = val as { url: string; name: string } | string;
              const imageUrl = typeof file === "string" ? file : file.url;
              const imageName =
                typeof file === "string" ? info.label : file.name;

              return (
                <div
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(imageUrl, "_blank");
                  }}
                  className={cn(
                    "relative group cursor-zoom-in shrink-0 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md bg-neutral-100 dark:bg-neutral-900 transition-all duration-300 hover:shadow-lg",
                    info.disabled && "opacity-60",
                  )}
                >
                  <img
                    src={imageUrl}
                    alt={imageName}
                    className="size-20 sm:size-24 object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white/95 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {info.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Files List Section */}
      {hasFiles && (
        <div className="flex flex-col gap-2 w-full">
          <div className="space-y-2">
            {entries.map(([key, val]) => {
              if (val === undefined || val === null || val === "") return null;

              const info = getFieldInfo(key, val);
              if (!info.isFile) return null;

              const file = val as {
                url: string;
                name: string;
                size: number;
                type: string;
              };

              let FileIconComp = FileText;
              const ext = file.name?.split(".").pop()?.toLowerCase();
              if (
                file.type?.includes("zip") ||
                file.type?.includes("tar") ||
                ext === "zip" ||
                ext === "rar"
              )
                FileIconComp = FileArchive;
              else if (
                file.type?.includes("sheet") ||
                file.type?.includes("excel") ||
                ext === "xls" ||
                ext === "xlsx"
              )
                FileIconComp = FileSpreadsheet;
              else FileIconComp = FileIcon;

              return (
                <div
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(file.url, "_blank");
                  }}
                  className={cn(
                    "flex items-center justify-between p-3.5 border border-neutral-200/60 dark:border-neutral-800/80 bg-white/40 dark:bg-neutral-950/20 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/30 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-xs group",
                    info.disabled && "opacity-75",
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0 max-w-[80%]">
                    <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <FileIconComp className="size-5 shrink-0 transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={cn(
                          "text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors",
                          info.disabled && "line-through text-neutral-500",
                        )}
                      >
                        {file.name}{" "}
                        {info.disabled && (
                          <span className="text-[9px] font-normal no-underline opacity-70 ml-1">
                            (disabled)
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                        {file.size
                          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                          : "Unknown Size"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center size-8 rounded-xl border border-neutral-200 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 hover:bg-blue-600 dark:hover:bg-blue-600 text-neutral-500 dark:text-neutral-400 hover:text-white dark:hover:text-white transition-all duration-150 shadow-xs shrink-0">
                    <Download className="size-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

      <Dialog open={!!pendingDM} onOpenChange={(o) => { if (!o) setPendingDM(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Send DM?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 px-6">
            {pendingDM?.templateMessage}
          </p>
          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPendingDM(null)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={isDMPending}
              onClick={() => {
                if (!pendingDM) return;
                sendInterestDM?.(pendingDM);
                setPendingDM(null);
                toastManager.add({
                  title: "Interest sent via DM!",
                  type: "success",
                });
              }}
            >
              <Send className="size-3.5 mr-1" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
