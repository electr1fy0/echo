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
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { toast } from "@/lib/toast";

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
        <div className="py-2">
          <form className="space-y-4" onSubmit={(e) => handleSubmit(e)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Chamber Name
              </label>
              <Input
                placeholder="e.g. Photography Club"
                value={chamber.name}
                onChange={(e) => updateChamber({ name: e.target.value })}
                className="rounded-xl mt-1 h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Description
              </label>
              <Textarea
                placeholder="What is this chamber about?"
                value={chamber.description}
                onChange={(e) => updateChamber({ description: e.target.value })}
                className="resize-none min-h-16 rounded-xl mt-1 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Theme Color
              </label>
              <div className="flex gap-2 flex-wrap mt-1">
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
                className="bg-[#ff5a1f] hover:bg-[#e94a12] text-white rounded-xl cursor-pointer h-9 text-xs font-semibold border-none"
              >
                Create Chamber
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
