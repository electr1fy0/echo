import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Chamber } from "@/types";
import { useCreateChamber } from "@/hooks/use-chamber";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { cn, getInitials } from "@/lib/utils";
import { useNavigate } from "react-router";
import { toast } from "@/lib/toast";
import { useImageUpload } from "@/hooks/use-image-upload";
import { CropImageDialog } from "@/components/ui/crop-image-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";

interface CreateChamberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChamberDialog({
  open,
  onOpenChange,
}: CreateChamberDialogProps) {
  const navigate = useNavigate();
  const { mutate: createChamber, isPending } = useCreateChamber();
  const { upload: uploadImage, uploading: imageUploading } = useImageUpload();
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
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
    if (isPending || !chamber.name.trim() || !chamber.description.trim()) return;

    createChamber(chamber, {
      onSuccess: (newChamber) => {
        onOpenChange(false);
        setChamber({
          name: "",
          description: "",
          colorIndex: 0,
        });
        if (newChamber?.uid) {
          navigate(`/chamber/${newChamber.uid}`);
          toast.success("Chamber created successfully");
        }
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to create chamber");
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create a Chamber</DialogTitle>
        </DialogHeader>
        <form className="space-y-5 py-2" onSubmit={(e) => handleSubmit(e)}>
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              Name
            </label>
            <Input
              placeholder="e.g. Photography Club"
              value={chamber.name}
              onChange={(e) => updateChamber({ name: e.target.value })}
              className="rounded-xl h-9 text-sm"
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
              className="resize-none min-h-16 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              Picture
            </label>
            <div className="flex items-center gap-3">
              {chamber.picture ? (
                <div className="relative size-14 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={chamber.picture}
                    alt="Chamber"
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => updateChamber({ picture: null })}
                    className="absolute top-0.5 right-0.5 size-4 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-2.5" />
                  </button>
                </div>
              ) : (
                <div
                  className={cn(
                    "size-14 rounded-xl flex items-center justify-center text-white text-sm shrink-0",
                    CHAMBER_COLORS[(chamber.colorIndex ?? 0) % CHAMBER_COLORS.length],
                  )}
                >
                  {getInitials(chamber.name || "C")}
                </div>
              )}
              <label className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
                {imageUploading ? (
                  <span className="inline-block size-3.5 rounded-full border-2 border-neutral-300 border-t-neutral-800 animate-spin" />
                ) : null}
                {imageUploading ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={imageUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setCropImageSrc(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              Theme
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

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="rounded-xl cursor-pointer h-9 text-xs">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !chamber.name.trim() || !chamber.description.trim()} 
              className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white rounded-xl cursor-pointer h-9 text-xs border-none"
            >
              Create Chamber
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
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
    </Dialog>
  );
}
