import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  Add01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { cn, getInitials } from "@/lib/utils";
import { Link } from "react-router";
import type { Chamber } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { EditChamberDialog } from "@/components/chambers/edit-chamber-dialog";
function formatMemberCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
interface ChamberCardProps {
  chamber: Chamber;
  compact?: boolean;
}
import { useJoinChamber, useLeaveChamber } from "@/hooks/use-chamber";
import { CHAMBER_COLORS } from "./consts";
export function ChamberCard({ chamber, compact = false }: ChamberCardProps) {
  const { data: user } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const joinMutation = useJoinChamber();
  const leaveMutation = useLeaveChamber();
  const isPending = joinMutation.isPending || leaveMutation.isPending;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const colorClass =
    CHAMBER_COLORS[(chamber.colorIndex ?? 0) % CHAMBER_COLORS.length];
  const canEdit = !!user?.username && user.username === chamber.creatorUsername;
  const handleToggleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("signin");
      return;
    }
    if (!chamber.uid || isPending) return;
    if (chamber.isJoined) {
      leaveMutation.mutate(chamber.uid);
    } else {
      joinMutation.mutate(chamber.uid);
    }
  };
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700",
        compact && "p-2",
      )}
    >
      <Link
        to={`/chamber/${chamber.uid}`}
        className="flex items-center gap-3 flex-1 min-w-0 group"
      >
        <div
          className={cn(
            "size-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 transition-opacity group-hover:opacity-90",
            colorClass,
          )}
        >
          {getInitials(chamber.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {chamber.name}
          </h3>
          <div className="flex items-center gap-1.5 text-neutral-500 mt-0.5">
            <HugeiconsIcon icon={UserMultiple02Icon} className="size-3" />
            <span className="text-xs font-medium">
              {formatMemberCount(chamber.memberCount || 0)} members
            </span>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            onClick={(e) => {
              e.preventDefault();
              setIsEditOpen(true);
            }}
            aria-label="Edit chamber"
          >
            <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" />
          </Button>
        )}
        <Button
          variant={chamber.isJoined ? "secondary" : "default"}
          size="sm"
          className={cn(
            "rounded-full h-7 px-3 text-xs font-medium transition-all shadow-none",
            !chamber.isJoined &&
            "bg-orange-600 hover:bg-orange-700 text-white border-transparent",
            chamber.isJoined &&
            "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
          )}
          onClick={handleToggleJoin}
        >
          {chamber.isJoined ? "Joined" : "Join"}
        </Button>
      </div>
      {canEdit && chamber.uid && (
        <EditChamberDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          chamber={chamber}
        />
      )}
    </div>
  );
}
interface ChamberListProps {
  chambers: Chamber[];
  limit?: number;
}
import { DashedEmptyState } from "@/components/ui/dashed-empty-state";
import { Search01Icon } from "@hugeicons/core-free-icons";

export function ChamberList({ chambers, limit }: ChamberListProps) {
  const displayChambers = limit ? chambers.slice(0, limit) : chambers;
  if (displayChambers.length === 0) {
    return (
      <DashedEmptyState
        title="No chambers found"
        description="Try searching for something else or create a new one."
        icon={<HugeiconsIcon icon={Search01Icon} className="size-8 opacity-50" />}
      />
    );
  }
  return (
    <div className="space-y-2">
      {displayChambers.map((chamber, i) => (
        <ChamberCard
          key={chamber.uid || i}
          chamber={{ ...chamber, colorIndex: chamber.colorIndex ?? i }}
        />
      ))}
    </div>
  );
}
interface CreateChamberButtonProps {
  onClick?: () => void;
  className?: string;
}
export function CreateChamberButton({
  onClick,
  className,
}: CreateChamberButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all",
        className,
      )}
    >
      <div className="size-10 rounded-xl flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-neutral-100">
        <HugeiconsIcon icon={Add01Icon} className="size-5" />
      </div>
      <span className="text-sm font-medium">Create a new Chamber</span>
    </button>
  );
}
