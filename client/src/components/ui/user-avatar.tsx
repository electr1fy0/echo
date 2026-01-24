import { useState, useEffect } from "react";
import { cn, getInitials } from "@/lib/utils";
const AVATAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];
export function UserAvatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const effectiveSrc = src || `https://github.com/${name}.png?size=256`;
  useEffect(() => {
    setImgError(false);
  }, [effectiveSrc]);
  if (!imgError) {
    return (
      <img
        src={effectiveSrc}
        alt={name}
        className={cn("rounded-full object-cover", className)}
        onError={() => setImgError(true)}
      />
    );
  }
  const charCode = name.charCodeAt(0) || 0;
  const colorIndex = charCode % AVATAR_COLORS.length;
  const colorClass = AVATAR_COLORS[colorIndex];
  const initials = getInitials(name);
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-medium text-xs select-none",
        colorClass,
        className,
      )}
    >
      {initials}
    </div>
  );
}
