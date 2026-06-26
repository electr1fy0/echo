import { useTheme } from "next-themes";
import { cn, getInitials } from "@/lib/utils";
import { CHAMBER_COLORS, CHAMBER_COLOR_HEX } from "@/components/chambers/consts";

export const DICEBEAR_ICONS_URL = "https://api.dicebear.com/10.x/icons/svg";

export function buildChamberIconUrl(seed: string, backgroundColor?: string, strokeColor?: string) {
  const params = new URLSearchParams({ seed: encodeURIComponent(seed) });
  if (backgroundColor) params.set("backgroundColor", backgroundColor);
  if (strokeColor) params.set("strokeColor", strokeColor);
  return `${DICEBEAR_ICONS_URL}?${params}`;
}

const STROKE_LIGHT = "d4d4d4";
const STROKE_DARK = "1a1a1a";

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
  const { resolvedTheme } = useTheme();

  const sizeClasses = {
    sm: "size-8 rounded-lg text-xs",
    md: "size-10 rounded-xl text-sm",
    lg: "size-16 rounded-2xl text-xl",
  };

  const idx = (colorIndex ?? 0) % CHAMBER_COLORS.length;
  const colorClass = CHAMBER_COLORS[idx];
  const bgHex = CHAMBER_COLOR_HEX[idx];
  const strokeColor = resolvedTheme === "dark" ? STROKE_DARK : STROKE_LIGHT;

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
          "shrink-0 overflow-hidden",
          sizeClasses[size],
          className,
        )}
      >
        <img
          src={buildChamberIconUrl(icon, bgHex, strokeColor)}
          alt={name}
          className="size-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center text-white font-medium shrink-0",
        sizeClasses[size],
        colorClass,
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
