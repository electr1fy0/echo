import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

type ImageCarouselProps = {
  urls: string[];
  className?: string;
};

export function ImageCarousel({ urls, className }: ImageCarouselProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const close = useCallback(() => {
    setLightboxIdx(null);
  }, []);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i! > 0 ? i! - 1 : i));
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i! < urls.length - 1 ? i! + 1 : i));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, urls.length, close]);

  const slide = useCallback((dir: -1 | 1) => {
    setLightboxIdx((i) => {
      if (i === null) return i;
      const next = i + dir;
      if (next < 0 || next >= urls.length) return i;
      return next;
    });
  }, [urls.length]);

  if (urls.length === 0) return null;

  return (
    <>
      <div className={cn("flex overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-lg bg-neutral-100 dark:bg-neutral-800", className)}>
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setLightboxIdx(i); }}
            className="snap-start shrink-0 w-full relative group cursor-pointer text-left"
          >
            <img src={url} alt="" draggable={false} className="w-full object-contain max-h-96 bg-neutral-100 dark:bg-neutral-800" loading="lazy" />
            {urls.length > 1 && (
              <div className="absolute bottom-2 right-2 text-[10px] bg-black/40 text-white px-1.5 py-0.5 rounded pointer-events-none">
                {i + 1}/{urls.length}
              </div>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          >
            {/* Close */}
            <motion.button
              type="button"
              onMouseDown={(e) => { e.stopPropagation(); close(); }}
              className="absolute top-4 right-4 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </motion.button>

            {/* Prev */}
            {lightboxIdx > 0 && (
              <motion.button
                type="button"
                onMouseDown={(e) => { e.stopPropagation(); slide(-1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-20"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </motion.button>
            )}

            {/* Next */}
            {lightboxIdx < urls.length - 1 && (
              <motion.button
                type="button"
                onMouseDown={(e) => { e.stopPropagation(); slide(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-20"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </motion.button>
            )}

            {/* Image — swipeable */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              onMouseDown={(e) => { e.stopPropagation(); close(); }}
              onPanEnd={(_, info) => {
                if (info.offset.x < -80) slide(1);
                else if (info.offset.x > 80) slide(-1);
              }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img
                  key={lightboxIdx}
                  src={urls[lightboxIdx]}
                  alt=""
                  className="max-w-[95vw] max-h-[95vh] object-contain pointer-events-none select-none"
                  draggable={false}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) slide(1);
                    else if (info.offset.x > 80) slide(-1);
                  }}
                />
              </AnimatePresence>
            </motion.div>

            {/* Counter */}
            {urls.length > 1 && (
              <motion.div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs bg-white/10 text-white px-3 py-1 rounded-full pointer-events-none z-20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                {lightboxIdx + 1} / {urls.length}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
