import { cn } from "@/lib/utils";
import type { Badge } from "@/types";
import {
  MessageSquare,
  Zap,
  BadgeCheck,
  Star,
  Stars,
  Medal,
  Award,
  Lock,
  Check,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverPopup } from "@/components/ui/popover";

const BADGE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  MessageSquare,
  Zap,
  BadgeCheck,
  Star,
  Stars,
  Medal,
  Award,
};

interface BadgeMeta {
  from: string;
  to: string;
  label: string;
  hint: string;
  unlock: string;
}

const BADGE_META: Record<string, BadgeMeta> = {
  first_post: {
    from: "#3b82f6",
    to: "#2563eb",
    label: "First Post",
    hint: "Asked your first question",
    unlock: "Post your first question",
  },
  energized: {
    from: "#f59e0b",
    to: "#ea580c",
    label: "Energized",
    hint: "Posted your first answer",
    unlock: "Answer your first question",
  },
  helpful: {
    from: "#10b981",
    to: "#0d9488",
    label: "Helpful",
    hint: "Your answer was accepted",
    unlock: "Have an answer accepted",
  },
  popular_question: {
    from: "#eab308",
    to: "#d97706",
    label: "Popular Question",
    hint: "A post reached 10 upvotes",
    unlock: "Get 10 upvotes on a single post",
  },
  rising_star: {
    from: "#8b5cf6",
    to: "#7c3aed",
    label: "Rising Star",
    hint: "A post reached 25 upvotes",
    unlock: "Get 25 upvotes on a single post",
  },
  expert: {
    from: "#f43f5e",
    to: "#e11d48",
    label: "Expert",
    hint: "Accepted 10 answers",
    unlock: "Have 10 answers accepted",
  },
  century: {
    from: "#06b6d4",
    to: "#0284c7",
    label: "Century",
    hint: "Earned 100 upvotes in total",
    unlock: "Receive 100 total upvotes across all content",
  },
};

const DEFAULT_META: BadgeMeta = {
  from: "#737373",
  to: "#525252",
  label: "Badge",
  hint: "",
  unlock: "Complete the requirements",
};

interface BadgeDisplayProps {
  badges: Badge[];
}

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
  if (!badges?.length) return null;

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div className="space-y-3">
      {earned.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {earned.map((badge) => {
            const meta = BADGE_META[badge.id] || DEFAULT_META;
            const Icon = BADGE_ICONS[badge.icon] || Award;
            return (
              <Popover key={badge.id}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        "relative size-12 rounded-full flex items-center justify-center",
                        "border-2 border-white/30 shadow-sm transition-all duration-200",
                        "hover:scale-110 hover:shadow-md cursor-pointer",
                      )}
                      style={{
                        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), transparent 65%), linear-gradient(135deg, ${meta.from}, ${meta.to})`,
                        boxShadow: `0 2px 8px ${meta.from}66, inset 0 1px 0 rgba(255,255,255,0.3)`,
                      }}
                    >
                      <div className="absolute inset-1 rounded-full border border-white/20" />
                      <Icon className="size-5 text-white drop-shadow-sm relative z-10" />
                    </button>
                  }
                />
                <PopoverPopup className="w-56 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "relative size-10 rounded-full flex items-center justify-center shrink-0",
                        "border-2 border-white/30",
                      )}
                      style={{
                        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), transparent 65%), linear-gradient(135deg, ${meta.from}, ${meta.to})`,
                        boxShadow: `0 2px 8px ${meta.from}66, inset 0 1px 0 rgba(255,255,255,0.3)`,
                      }}
                    >
                      <div className="absolute inset-1 rounded-full border border-white/20" />
                      <Icon className="size-5 text-white drop-shadow-sm relative z-10" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {meta.label}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {meta.hint}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3" />
                    Earned
                  </div>
                </PopoverPopup>
              </Popover>
            );
          })}
        </div>
      )}
      {locked.length > 0 && (
        <details className="group">
          <summary className="text-[11px] text-neutral-400 dark:text-neutral-500 cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors list-none flex items-center gap-1.5">
            <Lock className="size-3" />
            <span>{locked.length} locked</span>
          </summary>
          <div className="flex flex-wrap gap-2 pt-2">
            {locked.map((badge) => {
              const meta = BADGE_META[badge.id] || DEFAULT_META;
              const Icon = BADGE_ICONS[badge.icon] || Award;
              return (
                <Popover key={badge.id}>
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        className={cn(
                          "relative size-10 rounded-full flex items-center justify-center",
                          "border border-dashed border-neutral-300 dark:border-neutral-700",
                          "bg-neutral-50 dark:bg-neutral-900/50 cursor-pointer",
                          "hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors",
                        )}
                      >
                        <Icon className="size-4 text-neutral-300 dark:text-neutral-600" />
                      </button>
                    }
                  />
                  <PopoverPopup className="w-56 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="relative size-10 rounded-full flex items-center justify-center shrink-0">
                        <Icon className="size-5 text-neutral-300 dark:text-neutral-600" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {meta.label}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {meta.unlock}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                      <Lock className="size-3" />
                      Not yet earned
                    </div>
                  </PopoverPopup>
                </Popover>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
