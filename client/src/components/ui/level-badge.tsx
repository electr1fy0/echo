import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getLevel, getLevelProgress, getNextLevel } from "@/lib/level";
import { motion, AnimatePresence } from "motion/react";

interface LevelBadgeProps {
  reputation: number;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { box: 20, fontSize: 8, popover: "min-w-[180px]" },
  md: { box: 24, fontSize: 10, popover: "min-w-[220px]" },
  lg: { box: 32, fontSize: 12, popover: "min-w-[260px]" },
};

function ShieldSvg({ size, glow }: { size: number; glow: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 104" className="absolute inset-0">
      <defs>
        <linearGradient id="shieldFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={glow} />
          <stop offset="100%" stopColor={glow.replace("1)", "0.7)")} />
        </linearGradient>
        <linearGradient id="shieldShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
        </linearGradient>
        <filter id="shieldShadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={glow.replace("0.3)", "0.4)")} />
        </filter>
      </defs>
      <path
        d="M50 2 L92 18 L92 58 Q92 80 50 102 Q8 80 8 58 L8 18 Z"
        fill="url(#shieldFill)"
        filter="url(#shieldShadow)"
      />
      <path
        d="M50 2 L92 18 L92 58 Q92 80 50 102 Q8 80 8 58 L8 18 Z"
        fill="url(#shieldShine)"
      />
      <path
        d="M50 6 L87 20 L87 57 Q87 77 50 97 Q13 77 13 57 L13 20 Z"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function LevelBadge({ reputation, size = "sm" }: LevelBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const level = getLevel(reputation);
  const progress = getLevelProgress(reputation);
  const next = getNextLevel(reputation);
  const box = sizeMap[size].box;
  const fullColor = level.glow.replace("0.3", "1");

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative inline-flex items-center justify-center shrink-0 cursor-pointer",
          "transition-transform duration-150 hover:scale-110 active:scale-95",
        )}
        style={{ width: box, height: box }}
      >
        <ShieldSvg size={box} glow={level.glow} />
        <span
          className="relative font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
          style={{ fontSize: sizeMap[size].fontSize, lineHeight: 1 }}
        >
          {level.level}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "fixed z-50 rounded-xl border bg-white dark:bg-neutral-900 shadow-xl",
                "border-neutral-200 dark:border-neutral-700",
                sizeMap[size].popover,
              )}
              style={{
                top: ref.current ? ref.current.getBoundingClientRect().bottom + 8 : 0,
                left: ref.current ? Math.max(8, Math.min(ref.current.getBoundingClientRect().left - 60, window.innerWidth - 280)) : 0,
              }}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="size-10 relative shrink-0 flex items-center justify-center">
                    <ShieldSvg size={40} glow={level.glow} />
                    <span className="absolute font-bold text-white text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                      {level.level}
                    </span>
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {level.rank}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {level.label} &middot; {reputation} reputation
                    </div>
                  </div>
                </div>

                {next && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
                      <span>Level {level.level}</span>
                      <span>Level {next.level} &middot; {next.rank}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.progress * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${fullColor}, ${level.glow.replace("0.3", "0.7")})`,
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-right">
                      {next.minRep - reputation} rep to next level
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
