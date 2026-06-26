import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerPopup,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Chamber } from "@/types";
import { useCreateChamber } from "@/hooks/use-chamber";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { handleApiError } from "@/lib/api-error";
import { toastManager } from "@/components/ui/toast";
import { useImageUpload } from "@/hooks/use-image-upload";
import { CropImageDialog } from "@/components/ui/crop-image-dialog";
import { ChamberAvatar } from "@/components/ui/chamber-avatar";
import { ChamberIconPicker } from "@/components/chambers/chamber-icon-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/hooks/use-mobile";

interface CreateChamberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChamberDialog({
  open,
  onOpenChange,
}: CreateChamberDialogProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { mutate: createChamber, isPending } = useCreateChamber();
  const { upload: uploadImage } = useImageUpload();
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [editPage, setEditPage] = useState<"main" | "icon">("main");

  const [chamber, setChamber] = useState<Chamber>({
    name: "",
    description: "",
    colorIndex: 0,
  });

  const updateChamber = (fields: Partial<Chamber>) => {
    return setChamber((prev) => {
      return { ...prev, ...fields };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || !chamber.name.trim() || !chamber.description.trim())
      return;

    createChamber(chamber, {
      onSuccess: (newChamber) => {
        onOpenChange(false);
        setChamber({
          name: "",
          description: "",
          colorIndex: 0,
        });
        if (newChamber) {
          navigate(`/chambers/${newChamber.slug || newChamber.uid}`);
          toastManager.add({ title: "Chamber created successfully", type: "success" });
        }
      },
      onError: (err) => {
        handleApiError(err, "Failed to create chamber");
      },
    });
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) setEditPage("main");
  };

  const content = (
    <div
      className={cn("relative overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]", isMobile && "pt-1")}
      style={{ maxHeight: editPage === "icon" ? "80vh" : "420px" }}
    >
      <div
        className="flex transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-[200%]"
        style={{
          transform:
            editPage === "icon"
              ? "translateX(-50%)"
              : "translateX(0)",
        }}
      >
        {/* ───── Page 1: Main ───── */}
        <div className="w-1/2">
          <DialogHeader className={cn(isMobile ? "px-5 pt-6 pb-0" : "px-6 pt-6 pb-0")}>
            <DialogTitle>Create a Chamber</DialogTitle>
          </DialogHeader>
          <form id="create-chamber-form" className={cn(isMobile ? "space-y-3 py-3 px-5" : "space-y-3 py-3 px-6")} onSubmit={(e) => handleSubmit(e)}>
            <div className="space-y-1.5">
              <label className="text-sm text-neutral-700 dark:text-neutral-300">
                Name
              </label>
              <Input
                placeholder="e.g. my-chamber"
                value={chamber.name}
                onChange={(e) => updateChamber({ name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-neutral-700 dark:text-neutral-300">
                Description
              </label>
              <Textarea
                placeholder="What is this chamber about?"
                value={chamber.description}
                onChange={(e) => updateChamber({ description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
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
                    name={chamber.name || "C"}
                    picture={chamber.picture}
                    icon={chamber.icon}
                    colorIndex={chamber.colorIndex ?? 0}
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
          </form>
          <DialogFooter variant="bare">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              form="create-chamber-form"
              disabled={
                isPending || !chamber.name.trim() || !chamber.description.trim()
              }
            >
              Create Chamber
            </Button>
          </DialogFooter>
        </div>

        {/* ───── Page 2: Icon & Theme ───── */}
        <div className="w-1/2 flex flex-col max-h-[80vh]">
          <div className={cn("flex items-center gap-3", isMobile ? "px-5 pt-4 pb-3" : "px-6 pt-6 pb-3")}>
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

          <div className={cn("flex-1 overflow-y-auto scrollbar-modern space-y-5", isMobile ? "px-5" : "px-6")}>
            <ChamberIconPicker
              value={chamber.icon}
              colorIndex={chamber.colorIndex ?? 0}
              onChange={(seed) => {
                updateChamber({ icon: seed, picture: seed ? null : chamber.picture });
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
                    onClick={() => updateChamber({ colorIndex: index })}
                    className={cn(
                      "size-6 rounded-full transition-all ring-2 ring-offset-2 ring-transparent ring-offset-transparent cursor-pointer",
                      color,
                      {
                        "ring-neutral-900 dark:ring-neutral-100 ring-offset-white dark:ring-offset-neutral-900":
                          chamber.colorIndex === index,
                      },
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={cn("py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end", isMobile ? "px-5" : "px-6")}>
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
            const file = new File([blob], "chamber.jpg", { type: "image/jpeg" });
            const url = await uploadImage(file);
            if (url) updateChamber({ picture: url });
            setCropImageSrc(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[450px] overflow-hidden p-0" showCloseButton={editPage === "main"}>
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
          if (url) updateChamber({ picture: url });
          setCropImageSrc(null);
        }}
      />
    </>
  );
}
