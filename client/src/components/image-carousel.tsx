import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ImageCarouselProps = {
  urls: string[];
  className?: string;
};

export function ImageCarousel({ urls, className }: ImageCarouselProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const opening = useRef(false);

  const close = useCallback(() => setLightboxIdx(null), []);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i! > 0 ? i! - 1 : i!));
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i! < urls.length - 1 ? i! + 1 : i!));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, urls.length, close]);

  const open = (i: number) => {
    if (opening.current) return;
    opening.current = true;
    setLightboxIdx(i);
    requestAnimationFrame(() => { opening.current = false; });
  };

  if (urls.length === 0) return null;

  return (
    <>
      <div className={cn("flex overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-lg bg-neutral-100 dark:bg-neutral-800", className)}>
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); open(i); }}
            className="snap-start shrink-0 w-full relative group cursor-pointer text-left"
          >
            <img
              src={url}
              alt=""
              className="w-full object-contain max-h-96 bg-neutral-100 dark:bg-neutral-800"
              loading="lazy"
            />
            {urls.length > 1 && (
              <div className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/40 text-white px-1.5 py-0.5 rounded pointer-events-none">
                {i + 1}/{urls.length}
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <button
            type="button"
            onMouseDown={(e) => { e.stopPropagation(); close(); }}
            className="absolute top-4 right-4 size-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer z-10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {lightboxIdx > 0 && (
            <button
              type="button"
              onMouseDown={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer z-10"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {lightboxIdx < urls.length - 1 && (
            <button
              type="button"
              onMouseDown={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer z-10"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          <img
            src={urls[lightboxIdx]}
            alt=""
            className="max-w-[95vw] max-h-[95vh] object-contain pointer-events-none"
          />

          {urls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-semibold bg-black/40 text-white px-3 py-1 rounded-full pointer-events-none">
              {lightboxIdx + 1} / {urls.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}