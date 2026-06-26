import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Drawer, DrawerPopup } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Chamber } from "@/types";
import { useUpdateChamber } from "@/hooks/use-chamber";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn } from "@/lib/utils";
import { handleApiError } from "@/lib/api-error";
import { toastManager } from "@/components/ui/toast";
import { useImageUpload } from "@/hooks/use-image-upload";
import { CropImageDialog } from "@/components/ui/crop-image-dialog";
import { ChamberAvatar } from "@/components/ui/chamber-avatar";
import { ChamberIconPicker } from "@/components/chambers/chamber-icon-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/hooks/use-mobile";

type EditChamberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chamber: Chamber;
};

export function EditChamberDialog({
  open,
  onOpenChange,
  chamber,
}: EditChamberDialogProps) {
  const isMobile = useIsMobile();
  const { mutate: updateChamber, isPending } = useUpdateChamber();
  const { upload: uploadImage } = useImageUpload();
  const [draft, setDraft] = useState<Chamber>(chamber);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [editPage, setEditPage] = useState<"main" | "icon">("main");

  useEffect(() => {
    setDraft(chamber);
  }, [chamber]);

  const updateDraft = (fields: Partial<Chamber>) => {
    setDraft((prev) => ({ ...prev, ...fields }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name?.trim() || !draft.description?.trim() || !draft.uid) return;
    updateChamber(
      {
        uid: draft.uid,
        chamber: {
          name: draft.name.trim(),
          description: draft.description.trim(),
          colorIndex: draft.colorIndex ?? 0,
          picture: draft.picture,
          icon: draft.icon,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({ title: "Chamber updated", type: "success" });
          onOpenChange(false);
        },
        onError: (err) => {
          handleApiError(err, "Failed to update chamber");
        },
      },
    );
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) setEditPage("main");
  };

  const content = (
    <div
      className={cn(
        "relative overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isMobile && "pt-1",
      )}
      style={{ maxHeight: editPage === "icon" ? "80vh" : "420px" }}
    >
      <div
        className="flex transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-[200%]"
        style={{
          transform: editPage === "icon" ? "translateX(-50%)" : "translateX(0)",
        }}
      >
        {/* ───── Page 1: Main ───── */}
        <div className="w-1/2">
          <DialogHeader
            className={cn(isMobile ? "px-5 pt-4 pb-0" : "px-6 pt-6 pb-0")}
          >
            <DialogTitle>Edit Chamber</DialogTitle>
          </DialogHeader>
          <form
            className={cn(
              isMobile ? "space-y-2 py-2 px-5" : "space-y-4 py-0 px-0",
            )}
            onSubmit={handleSubmit}
          >
            <div className="space-y-1.5 pt-3 px-6">
              <label className="text-sm text-neutral-700 dark:text-neutral-300">
                Name
              </label>
              <Input
                value={draft.name}
                placeholder="e.g. my-chamber"
                onChange={(e) => updateDraft({ name: e.target.value })}
                className="rounded-xl h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5  px-6">
              <label className="text-sm text-neutral-700 dark:text-neutral-300">
                Description
              </label>
              <Textarea
                value={draft.description}
                placeholder="What is this chamber about?"
                onChange={(e) => updateDraft({ description: e.target.value })}
                className="resize-none min-h-20 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5 px-6">
              <label className="text-sm text-neutral-700 dark:text-neutral-300">
                Avatar
              </label>
              <button
                type="button"
                onClick={() => setEditPage("icon")}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <ChamberAvatar
                    name={draft.name}
                    picture={draft.picture}
                    icon={draft.icon}
                    colorIndex={draft.colorIndex ?? 0}
                    size="md"
                    className="size-10"
                  />
                  <div className="text-left">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Icon & Theme
                    </span>
                    <p className="text-xs text-neutral-500">
                      Choose icon style and color
                    </p>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowLeft02Icon}
                  className="size-4 text-neutral-400 rotate-180 group-hover:-translate-x-0.5 transition-transform"
                />
              </button>
            </div>
            {isMobile ? (
              <div className="flex justify-end  gap-2 px-5 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl cursor-pointer h-9 text-xs "
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !draft.name?.trim() ||
                    !draft.description?.trim() ||
                    isPending
                  }
                  className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white rounded-xl cursor-pointer h-9 text-xs border-none"
                >
                  Save
                </Button>
              </div>
            ) : (
              <DialogFooter className="!px-6">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl cursor-pointer h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !draft.name?.trim() ||
                    !draft.description?.trim() ||
                    isPending
                  }
                  className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white rounded-xl cursor-pointer h-9 text-xs border-none"
                >
                  Save
                </Button>
              </DialogFooter>
            )}
          </form>
        </div>

        {/* ───── Page 2: Icon & Theme ───── */}
        <div className="w-1/2 flex flex-col max-h-[80vh]">
          <div
            className={cn(
              "flex items-center gap-3",
              isMobile ? "px-5 pt-4 pb-3" : "px-6 pt-6 pb-3",
            )}
          >
            <button
              type="button"
              onClick={() => setEditPage("main")}
              className="size-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer -ml-1.5"
            >
              <HugeiconsIcon
                icon={ArrowLeft02Icon}
                className="size-4 text-neutral-600 dark:text-neutral-400"
              />
            </button>
            <DialogTitle>Icon & Theme</DialogTitle>
          </div>

          <div
            className={cn(
              "flex-1 overflow-y-auto scrollbar-modern space-y-5",
              isMobile ? "px-5" : "px-6",
            )}
          >
            <ChamberIconPicker
              value={draft.icon}
              colorIndex={draft.colorIndex ?? 0}
              onChange={(seed) => {
                updateDraft({
                  icon: seed,
                  picture: seed ? null : draft.picture,
                });
              }}
            />

            <div className="pb-8">
              <label className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 block">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {CHAMBER_COLORS.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => updateDraft({ colorIndex: index })}
                    className={cn(
                      "size-6 rounded-full transition-all ring-2 ring-offset-2 ring-transparent ring-offset-transparent cursor-pointer",
                      color,
                      {
                        "ring-neutral-900 dark:ring-neutral-100 ring-offset-white dark:ring-offset-neutral-900":
                          draft.colorIndex === index,
                      },
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end",
              isMobile ? "px-5" : "px-6",
            )}
          >
            <Button
              type="button"
              className="min-w-[100px]"
              onClick={() => setEditPage("main")}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={handleClose}>
          <DrawerPopup className="p-0" showCloseButton={editPage === "main"}>
            {content}
          </DrawerPopup>
        </Drawer>
        <CropImageDialog
          open={!!cropImageSrc}
          onOpenChange={() => setCropImageSrc(null)}
          imageSrc={cropImageSrc || ""}
          onCropComplete={async (blob) => {
            const file = new File([blob], "chamber.jpg", {
              type: "image/jpeg",
            });
            const url = await uploadImage(file);
            if (url) updateDraft({ picture: url });
            setCropImageSrc(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-[500px] overflow-hidden p-0"
          showCloseButton={editPage === "main"}
        >
          {content}
        </DialogContent>
      </Dialog>
      <CropImageDialog
        open={!!cropImageSrc}
        onOpenChange={() => setCropImageSrc(null)}
        imageSrc={cropImageSrc || ""}
        onCropComplete={async (blob) => {
          const file = new File([blob], "chamber.jpg", { type: "image/jpeg" });
          const url = await uploadImage(file);
          if (url) updateDraft({ picture: url });
          setCropImageSrc(null);
        }}
      />
    </>
  );
}
