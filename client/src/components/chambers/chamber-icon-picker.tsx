import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ChamberAvatar } from "@/components/ui/chamber-avatar";
import { buildChamberIconUrl } from "@/components/ui/chamber-avatar";
import { CHAMBER_COLOR_HEX } from "@/components/chambers/consts";

const NEUTRAL_BG_LIGHT = "e5e5e5";
const NEUTRAL_BG_DARK = "333333";
const NEUTRAL_ICON_COLOR = "ffffff";

const ICON_SEEDS = [
  "acorn", "alarm", "alien", "anchor", "apple", "award", "backpack", "bag",
  "balloon", "banana", "bandaid", "basket", "beach", "bell", "bicycle",
  "binoculars", "bluetooth", "boat", "book", "bookmark", "boom", "bootstrap",
  "box", "briefcase", "brightness", "brush", "bug", "building", "bulb",
  "bullseye", "bus", "cake", "calculator", "calendar", "camera", "camp",
  "candle", "cap", "car", "card", "cart", "cash", "castle", "cat",
  "chat", "check", "checklist", "chess", "chip", "clock", "cloud",
  "club", "code", "coffee", "coin", "compass", "cone", "controller",
  "cookie", "cool", "cpu", "crop", "crown", "cube", "cup", "cupcake",
  "cursor", "dash", "database", "desktop", "diamond", "dice", "disc",
  "display", "dog", "door", "download", "dragon", "drawer", "drink",
  "drop", "droplet", "ear", "earbuds", "easel", "egg", "emoji", "engine",
  "envelope", "eraser", "ethernet", "eye", "eyedropper", "face", "fan",
  "fast", "file", "film", "filter", "finger", "fire", "flag", "flame",
  "flash", "flashlight", "flask", "flower", "folder", "foot", "fork",
  "forward", "framer", "fridge", "fruit", "fuel", "fullscreen", "game",
  "gauge", "gear", "gem", "ghost", "gift", "globe", "glasses", "gps",
  "graph", "grid", "grin", "grip", "hammer", "hand", "happy", "harddrive",
  "hash", "headphones", "heart", "hearts", "helicopter", "helmet", "hexagon",
  "hill", "home", "hook", "hop", "hourglass", "house", "ice", "image",
  "inbox", "infinity", "info", "input", "invert", "island", "jar",
  "joystick", "key", "keyboard", "keyhole", "lamp", "laptop", "layer",
  "layout", "leaf", "light", "lightning", "link", "list", "location",
  "lock", "luggage", "magic", "magnet", "mail", "map", "marker", "mask",
  "megaphone", "memory", "menu", "message", "mic", "microphone", "moon",
  "mountain", "mouse", "mouth", "movie", "music", "needle", "network",
  "newspaper", "node", "note", "notebook", "notepad", "nut", "octagon",
  "option", "outlet", "package", "pad", "page", "palette", "paperclip",
  "paragraph", "park", "pause", "paw", "peace", "pencil", "people",
  "person", "phone", "photo", "piano", "picture", "pie", "pin", "pizza",
  "plane", "planet", "plant", "play", "plug", "plus", "pointer", "post",
  "power", "present", "print", "puzzle", "qr", "question", "quote",
  "radio", "rain", "random", "receipt", "record", "recycle", "repeat",
  "reply", "report", "ribbon", "rocket", "roll", "roof",
  "root", "router", "rss", "ruler", "safe", "sail", "save", "scanner",
  "scissors", "screen", "screwdriver", "sd", "search", "send", "server",
  "settings", "share", "shield", "ship", "shirt", "shoe", "shop",
  "shuffle", "signal", "signpost", "sim", "sine", "skull", "sliders",
  "smartphone", "smile", "snap", "snow", "socket", "sort", "sound",
  "spade", "spark", "sparkles", "speaker", "speedometer", "spellcheck",
  "spinner", "sport", "square", "stack", "star", "stars", "steering",
  "stop", "stopwatch", "storm", "stripe", "sub", "subtitles", "sun",
  "sunrise", "sunset", "switch", "sync", "table", "tablet", "tag",
  "target", "task", "taxi", "telephone", "terminal", "test", "text",
  "thermometer", "thunder", "ticket", "tiktok", "timer", "tips", "toggle",
  "tool", "tooth", "tornado", "tower", "track", "traffic", "train",
  "trash", "tree", "triangle", "trophy", "truck", "trumpet", "tshirt",
  "tv", "umbrella", "unlink", "unlock", "upload", "usb", "user",
  "valentine", "vault", "video", "view", "vinyl", "voice", "volume",
  "vr", "walk", "wallet", "wallpaper", "warning", "watch", "water",
  "wavelength", "web", "wifi", "wind", "wine", "witch", "wrench",
  "xray", "yin", "youtube", "zipper", "zoom",
];

interface ChamberIconPickerProps {
  value?: string | null;
  onChange: (seed: string | null) => void;
  colorIndex?: number;
}

export function ChamberIconPicker({ value, onChange, colorIndex = 0 }: ChamberIconPickerProps) {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const neutralBg = isDark ? NEUTRAL_BG_DARK : NEUTRAL_BG_LIGHT;
  const themeHex = CHAMBER_COLOR_HEX[colorIndex % CHAMBER_COLOR_HEX.length];

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 py-2">
        {value ? (
          <>
            <img
              src={buildChamberIconUrl(value, themeHex, NEUTRAL_ICON_COLOR)}
              alt={value}
              className="size-16 rounded-lg"
            />
            <span className="text-xs text-neutral-500 font-mono">{value}</span>
          </>
        ) : (
          <ChamberAvatar
            name="Aa"
            colorIndex={colorIndex}
            size="lg"
            className="size-16"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto scrollbar-modern pt-1">
        <button
          type="button"
          onClick={() => onChange(null)}
          className="size-8 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all cursor-pointer shrink-0"
          title="No icon"
        >
          <span className="text-[10px] text-neutral-400 font-medium">x</span>
        </button>
        {ICON_SEEDS.map((seed) => (
          <button
            key={seed}
            type="button"
            onClick={() => onChange(seed)}
            className={cn(
              "size-8 rounded-lg overflow-hidden border transition-all cursor-pointer",
              value === seed
                ? "border-neutral-900 dark:border-neutral-100 ring-1 ring-neutral-900 dark:ring-neutral-100"
                : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600",
            )}
            title={seed}
          >
            <img
              src={buildChamberIconUrl(seed, value === seed ? themeHex : neutralBg, NEUTRAL_ICON_COLOR)}
              alt={seed}
              className="size-full"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
