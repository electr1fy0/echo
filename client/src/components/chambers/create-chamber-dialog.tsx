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
    type: "global",
    branchName: "",
    courseCode: "",
    semester: "",
  });

  const updateChamber = (fields: Partial<Chamber>) => {
    return setChamber((prev) => {
      return { ...prev, ...fields };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || !chamber.name.trim() || !chamber.description.trim()) return;

    // Validate course parameters if it's a course chamber
    if (chamber.type === "course") {
      if (!chamber.branchName?.trim() || !chamber.courseCode?.trim()) {
        toast.error("Branch and Course Code are required for Course Chambers");
        return;
      }
    }

    createChamber(chamber, {
      onSuccess: (newChamber) => {
        onOpenChange(false);
        // Reset state
        setChamber({
          name: "",
          description: "",
          colorIndex: 0,
          type: "global",
          branchName: "",
          courseCode: "",
          semester: "",
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
            
            {/* Chamber Type Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Chamber Type
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => updateChamber({ type: "global" })}
                  className={cn(
                    "py-2 px-3 text-sm font-medium rounded-xl border text-center transition-colors cursor-pointer",
                    chamber.type === "global"
                      ? "bg-[#ff5a1f] text-white border-transparent"
                      : "border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  )}
                >
                  Global Community
                </button>
                <button
                  type="button"
                  onClick={() => updateChamber({ type: "course" })}
                  className={cn(
                    "py-2 px-3 text-sm font-medium rounded-xl border text-center transition-colors cursor-pointer",
                    chamber.type === "course"
                      ? "bg-[#ff5a1f] text-white border-transparent"
                      : "border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  )}
                >
                  Course Chamber
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Chamber Name
              </label>
              <Input
                placeholder={chamber.type === "course" ? "e.g. Intro to Programming" : "e.g. Photography Club"}
                value={chamber.name}
                onChange={(e) => updateChamber({ name: e.target.value })}
                className="rounded-xl mt-1 h-9 text-sm"
              />
            </div>

            {/* Course specific fields */}
            {chamber.type === "course" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Course Code
                  </label>
                  <Input
                    placeholder="e.g. CS-101"
                    value={chamber.courseCode}
                    onChange={(e) => updateChamber({ courseCode: e.target.value })}
                    className="rounded-xl mt-1 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Branch / Major
                  </label>
                  <select
                    value={chamber.branchName || ""}
                    onChange={(e) => updateChamber({ branchName: e.target.value })}
                    className="flex h-9 w-full rounded-xl border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-neutral-800 dark:bg-neutral-950 mt-1 text-neutral-700 dark:text-neutral-300"
                  >
                    <option value="" disabled>Select Branch</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Comm</option>
                    <option value="Mechanical Engineering">Mechanical Eng</option>
                    <option value="Electrical Engineering">Electrical Eng</option>
                    <option value="General Science">General Science</option>
                    <option value="Economics">Economics</option>
                    <option value="Business School">Business School</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Semester / Term (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Semester 4, Fall 2026"
                    value={chamber.semester}
                    onChange={(e) => updateChamber({ semester: e.target.value })}
                    className="rounded-xl mt-1 h-9 text-sm"
                  />
                </div>
              </div>
            )}

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
