import { cn, getInitials } from "@/lib/utils";
import { CHAMBER_COLORS, CHAMBER_COLOR_HEX } from "@/components/chambers/consts";

export const DICEBEAR_ICONS_URL = "https://api.dicebear.com/10.x/icons/svg";

export function buildChamberIconUrl(seed: string, backgroundColor?: string, iconColor?: string) {
  const params = new URLSearchParams({ seed: encodeURIComponent(seed) });
  if (backgroundColor) params.set("backgroundColor", backgroundColor);
  if (iconColor) params.set("iconColor", iconColor);
  return `${DICEBEAR_ICONS_URL}?${params}`;
}

const ICON_COLOR = "ffffff";

export function ChamberAvatar({
  name,
  picture,
  icon,
  colorIndex,
  size = "md",
  className,
}: {
  name: string;
  picture?: string | null;
  icon?: string | null;
  colorIndex?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "size-8 rounded-lg text-base",
    md: "size-10 rounded-xl text-lg",
    lg: "size-16 rounded-2xl text-3xl",
  };

  const idx = (colorIndex ?? 0) % CHAMBER_COLORS.length;
  const bgHex = CHAMBER_COLOR_HEX[idx];
  const iconColor = ICON_COLOR;

  if (picture) {
    return (
      <img
        src={picture}
        alt={name}
        className={cn("object-cover shrink-0", sizeClasses[size], className)}
      />
    );
  }

  if (icon) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden border border-white dark:border-0",
          sizeClasses[size],
          className,
        )}
        style={{ backgroundColor: `#${bgHex}` }}
      >
        <img
          src={buildChamberIconUrl(icon, bgHex, iconColor)}
          alt={name}
          className="size-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center text-white font-medium shrink-0 border border-white dark:border-0",
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: `#${bgHex}` }}
    >
      {getInitials(name)}
    </div>
  );
}
