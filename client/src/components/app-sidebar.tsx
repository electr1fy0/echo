import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Search01Icon,
  Add01Icon,
  FavouriteIcon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQuestionDraft } from "@/hooks/use-questions";

type NavItem = {
  icon: typeof Home01Icon;
  label: string;
  active?: boolean;
  hasBackground?: boolean;
  hasBadge?: boolean;
  onClick?: () => void;
};

function CreateQueryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { draft, updateDraft, resetDraft } = useQuestionDraft();
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = () => {
    if (!draft.content.trim()) return;
    setIsPending(true);
    setTimeout(() => {
      console.log("Mock question submitted:", draft.content);
      resetDraft();
      setIsPending(false);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Query</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="What's on your mind?"
            className="w-full resize-none bg-transparent focus-visible:ring-0 p-0 text-base border-none rounded-none shadow-none min-h-16 placeholder:text-neutral-400"
            value={draft.content}
            onChange={(e) => updateDraft({ content: e.target.value })}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Posting..." : "Ask Query"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useNavigate, useLocation } from "react-router";

export function AppSidebar() {
  const isMobile = useIsMobile();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      icon: Home01Icon,
      label: "Home",
      active: location.pathname === "/home",
      onClick: () => navigate("/home"),
    },
    {
      icon: Search01Icon,
      label: "Search",
      active: location.pathname === "/search",
      onClick: () => navigate("/search"),
    },
    {
      icon: Add01Icon,
      label: "Create",
      hasBackground: true,
      onClick: () => setCreateOpen(true),
    },
    {
      icon: FavouriteIcon,
      label: "Notifications",
      hasBadge: true,
      active: location.pathname === "/notifications",
      onClick: () => navigate("/notifications"),
    },
    {
      icon: User02Icon,
      label: "Profile",
      active: location.pathname === "/profile",
      onClick: () => navigate("/profile"),
    },
  ];

  if (isMobile) {
    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 dark:border-neutral-800 bg-background">
          <div className="flex items-center justify-around py-3">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  "relative flex items-center justify-center p-2 rounded-xl transition-colors",
                  item.hasBackground && "bg-neutral-200 dark:bg-neutral-800",
                  item.active
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                )}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  className="size-7"
                  strokeWidth={item.active ? 2.5 : 1.5}
                />
                {item.hasBadge && (
                  <span className="absolute top-1 right-1 size-2.5 rounded-full bg-red-500" />
                )}
              </button>
            ))}
          </div>
        </nav>
        <CreateQueryDialog open={createOpen} onOpenChange={setCreateOpen} />
      </>
    );
  }

  return (
    <>
      <aside className="sticky top-0 h-screen flex flex-col items-center justify-center py-6 px-3 border-r border-neutral-200 dark:border-neutral-800">
        <nav className="flex flex-col items-center gap-5">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={cn(
                "relative flex items-center justify-center size-14 rounded-xl transition-colors",
                item.hasBackground && "bg-neutral-200 dark:bg-neutral-800",
                item.active
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                className="size-6"
                strokeWidth={item.active ? 2.5 : 1.5}
              />
              {item.hasBadge && (
                <span className="absolute top-2 right-2 size-2.5 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </nav>
      </aside>
      <CreateQueryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
