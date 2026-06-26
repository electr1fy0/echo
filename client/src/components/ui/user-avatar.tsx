import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

const DICEBEAR_URL = "https://api.dicebear.com/10.x/dylan/svg";

export function UserAvatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const seed = encodeURIComponent(name);
  const isCustomAvatar = src && !src.startsWith("https://github.com/");
  const effectiveSrc = isCustomAvatar ? src : `${DICEBEAR_URL}?seed=${seed}`;

  const charCode = name.charCodeAt(0) || 0;
  const colorIndex = charCode % AVATAR_COLORS.length;
  const colorClass = AVATAR_COLORS[colorIndex];

  return (
    <Avatar className={className}>
      <AvatarImage src={effectiveSrc} alt={name} />
      <AvatarFallback className={cn(colorClass, "text-white/80 font-medium text-sm")}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
