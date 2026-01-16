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
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQuestionDraft, useCreateQuestion } from "@/hooks/use-questions";

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
  const { question, updateQuestion, setQuestion } = useQuestionDraft();
  const { mutate: submitQuestion, isPending } = useCreateQuestion();

  const handleSubmit = () => {
    if (!question.content?.trim()) return;
    submitQuestion(question, {
      onSuccess: () => {
        setQuestion({ content: "" });
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Query</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Textarea
            placeholder="Ask a question from your community"
            className="resize-none h-32 bg-transparent rounded-2xl  dark:placeholder:text-neutral-600 placeholder:text-neutral-400"
            value={question.content}
            onChange={(e) => updateQuestion({ content: e.target.value })}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            <HugeiconsIcon icon={Add01Icon} className="mr-1 size-4" />
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
    { icon: FavouriteIcon, label: "Notifications", hasBadge: true },
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
